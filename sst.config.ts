/// <reference path="./.sst/platform/config.d.ts" />

const {
  SERVICE_ID,
  DAILY_USAGE_TABLE_NAME,
  API_NAME,
  AWS_REGION,
  TARIFF_DATA_WRITE_DLQ_NAME,
  TARIFF_DATA_WRITE_QUEUE_NAME,
  TARIFF_DATA_QUEUE_PROCESSOR_NAME,
  HISTORICAL_TARIFF_PUBLISHER_NAME,
  YESTERDAYS_TARIFF_PUBLISHER_NAME,
  TARIFF_SWITCHER_NAME,
} = await import('./config/infra');

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

    const api = new sst.aws.ApiGatewayV2(API_NAME);

    const dailyUsageTable = new sst.aws.Dynamo(DAILY_USAGE_TABLE_NAME, {
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
          readCapacity: 5,
          writeCapacity: 5,
          globalSecondaryIndexes: [
            {
              name: 'gsiByMonthTime',
              hashKey: 'month',
              rangeKey: 'usageTime',
              projectionType: 'ALL',
              readCapacity: 5,
              writeCapacity: 5,
            },
          ],
        },
      },
    });

    const tariffDataWriteDLQ = new sst.aws.Queue(TARIFF_DATA_WRITE_DLQ_NAME, {
      fifo: true,
    });

    const tariffDataWriteQueue = new sst.aws.Queue(TARIFF_DATA_WRITE_QUEUE_NAME, {
      fifo: true,
      dlq: tariffDataWriteDLQ.arn,
      visibilityTimeout: '120 seconds',
    });

    tariffDataWriteQueue.subscribe(
      {
        handler: 'handler.processTariffDataQueue',
        link: [dailyUsageTable],
        name: `${$app.stage}--${TARIFF_DATA_QUEUE_PROCESSOR_NAME}`,
        environment: {
          SERVICE_ID: TARIFF_DATA_QUEUE_PROCESSOR_NAME,
        },
        timeout: '110 seconds',
      },
      {
        batch: {
          partialResponses: true,
          size: 3,
        },
      },
    );

    api.route(
      'GET /backfill',
      {
        handler: 'handler.publishHistoricalTariffData',
        link: [tariffDataWriteQueue, secrets.AccNumber, secrets.ApiKey],
        name: `${$app.stage}--${HISTORICAL_TARIFF_PUBLISHER_NAME}`,
        timeout: '5 minutes',
        environment: {
          SERVICE_ID: HISTORICAL_TARIFF_PUBLISHER_NAME,
        },
        logging: {
          retention: '1 month',
        },
      },
      {
        auth: { iam: true },
      },
    );

    new sst.aws.Cron(`${YESTERDAYS_TARIFF_PUBLISHER_NAME}-cron`, {
      schedule: 'cron(0 22 * * ? *)',
      job: {
        handler: 'handler.publishYesterdaysTariff',
        link: [tariffDataWriteQueue, secrets.AccNumber, secrets.ApiKey],
        name: `${$app.stage}--${YESTERDAYS_TARIFF_PUBLISHER_NAME}`,
        timeout: '1 minute',
        environment: {
          SERVICE_ID: YESTERDAYS_TARIFF_PUBLISHER_NAME,
        },
      },
    });

    const tariffSwitcher = new sst.aws.Function(TARIFF_SWITCHER_NAME, {
      handler: 'handler.tariffSwitcher',
      link: [...allSecrets],
      name: `${$app.stage}--${TARIFF_SWITCHER_NAME}`,
      timeout: '300 seconds',
      environment: {
        SERVICE_ID: TARIFF_SWITCHER_NAME,
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

    new aws.scheduler.Schedule(`${SERVICE_ID}-scheduler`, {
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
