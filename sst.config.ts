/// <reference path="./.sst/platform/config.d.ts" />

import * as aws from '@pulumi/aws';

const SERVICE_ID = 'octopus-tariff-switcher';
const SERVICE_NAME = 'OctopusTariffSwitcher';
const AWS_REGION = 'eu-west-2';

export default $config({
  app(input) {
    return {
      name: SERVICE_ID,
      removal: 'remove',
      home: 'aws',
      providers: {
        aws: {
          region: AWS_REGION,
          profile: input.stage === 'production' ? 'octopus-production' : 'octopus-dev',
        },
      },
    };
  },
  async run() {
    $transform(sst.aws.Function, (args) => {
      args.runtime = 'nodejs22.x';
      args.url ??= $dev ? { authorization: 'iam' } : false;
      args.logging = {
        format: 'json',
        retention: '1 year',
        ...args.logging,
      };
      args.environment = {
        POWERTOOLS_DEV: String($dev),
        ...args.environment,
      };
    });

    const secrets = {
      AccNumber: new sst.Secret('AccNumber'),
      ApiKey: new sst.Secret('ApiKey'),
      SparkPostApiKey: new sst.Secret('SparkPostApiKey'),
      EmailFrom: new sst.Secret('EmailFrom'),
      MjmlAppId: new sst.Secret('MjmlAppId'),
      MjmlSecretKey: new sst.Secret('MjmlSecretKey'),
    };

    const allSecrets = Object.values(secrets);

    const api = new sst.aws.ApiGatewayV2(`${SERVICE_NAME}Api`);

    const dailyUsageTable = new sst.aws.Dynamo(`${SERVICE_NAME}DailyUsageTable`, {
      fields: {
        PK: 'string', // Partition key (e.g., DATE#2025-04-01)
        SK: 'string', // Sort key (e.g., SUMMARY or HH#05:30)
        month: 'string', // For GSI partition key
        usageTime: 'string', // For GSI sort key (e.g., "05:30")
      },
      primaryIndex: {
        hashKey: 'PK',
        rangeKey: 'SK',
      },
      globalIndexes: {
        gsiByMonthTime: {
          hashKey: 'month',
          rangeKey: 'usageTime',
        },
      },
      transform: {
        table: {
          billingMode: 'PROVISIONED',
          readCapacity: 25,
          writeCapacity: 25,
          globalSecondaryIndexes: [
            {
              name: 'gsiByMonthTime',
              hashKey: 'month',
              rangeKey: 'usageTime',
              projectionType: 'ALL',
              readCapacity: 25,
              writeCapacity: 25,
            },
          ],
        },
      },
    });

    const tariffDataWriteDLQ = new sst.aws.Queue(`${SERVICE_NAME}WriteDLQ`, {
      fifo: true,
    });

    const tariffDataWriteQueue = new sst.aws.Queue(`${SERVICE_NAME}WriteQueue`, {
      fifo: true,
      dlq: tariffDataWriteDLQ.arn,
      visibilityTimeout: '45 seconds',
    });

    tariffDataWriteQueue.subscribe(
      {
        handler: 'handler.processTariffDataQueue',
        link: [dailyUsageTable],
        name: `${$app.stage}--${SERVICE_ID}-tariff-data-queue-processor`,
        environment: {
          SERVICE_ID: `${SERVICE_ID}-tariff-data-queue-processor`,
        },
        timeout: '30 seconds',
      },
      {
        batch: {
          partialResponses: true,
        },
      },
    );

    api.route(
      'GET /backfill',
      {
        handler: 'handler.publishHistoricalTariffData',
        link: [tariffDataWriteQueue, secrets.AccNumber, secrets.ApiKey],
        name: `${$app.stage}--${SERVICE_ID}-historical-message-publisher`,
        timeout: '5 minutes',
        environment: {
          SERVICE_ID: `${SERVICE_ID}-historical-tariff-data-publisher`,
        },
        logging: {
          retention: '1 month',
        },
      },
      {
        auth: { iam: true },
      },
    );

    new sst.aws.Cron(`${SERVICE_NAME}PublishYesterdaysTariffCron`, {
      schedule: 'cron(0 22 * * ? *)',
      job: {
        handler: 'handler.publishYesterdaysTariff',
        link: [tariffDataWriteQueue, secrets.AccNumber, secrets.ApiKey],
        name: `${$app.stage}--${SERVICE_ID}-yesterdays-tariff-publisher`,
        timeout: '1 minute',
        environment: {
          SERVICE_ID: `${SERVICE_ID}-yesterdays-tariff-publisher`,
        },
      },
    });

    const tariffSwitcher = new sst.aws.Function(SERVICE_NAME, {
      handler: 'handler.tariffSwitcher',
      link: [...allSecrets],
      name: `${$app.stage}--${SERVICE_ID}`,
      timeout: '70 seconds',
      environment: {
        SERVICE_ID,
        DRY_RUN: String($dev),
      },
    });

    const tariffSwitcherSchedulerRole = new aws.iam.Role('SchedulerRole', {
      assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: 'scheduler.amazonaws.com',
      }),
    });

    new aws.iam.RolePolicy('InvokeLambdaPolicy', {
      role: tariffSwitcherSchedulerRole.id,
      policy: tariffSwitcher.arn.apply((arn) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: 'lambda:InvokeFunction',
              Resource: arn,
            },
          ],
        }),
      ),
    });

    new aws.scheduler.Schedule(`${SERVICE_NAME}Scheduler`, {
      scheduleExpression: 'cron(45 23 * * ? *)',
      scheduleExpressionTimezone: 'Europe/London',
      flexibleTimeWindow: {
        mode: 'OFF',
      },
      target: {
        arn: tariffSwitcher.arn,
        roleArn: tariffSwitcherSchedulerRole.arn,
      },
    });
  },
});
