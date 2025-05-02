/// <reference path="./.sst/platform/config.d.ts" />

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

    new sst.aws.Cron(`${SERVICE_NAME}Cron`, {
      schedule: 'cron(45 22 * * ? *)',
      job: {
        handler: 'handler.tariffSwitcher',
        link: [...allSecrets],
        name: `${$app.stage}--${SERVICE_ID}`,
        timeout: '70 seconds',
        environment: {
          SERVICE_ID,
          DRY_RUN: String($dev),
        },
      },
    });

    const backfillWriteDLQ = new sst.aws.Queue(`${SERVICE_NAME}WriteDLQ`, {
      fifo: true,
    });

    const backfillWriteQueue = new sst.aws.Queue(`${SERVICE_NAME}WriteQueue`, {
      fifo: true,
      dlq: backfillWriteDLQ.arn,
      visibilityTimeout: '45 seconds',
    });

    backfillWriteQueue.subscribe(
      {
        handler: 'handler.processBackfillQueue',
        link: [dailyUsageTable],
        name: `${$app.stage}--${SERVICE_ID}-backfill-message-processor`,
        environment: {
          SERVICE_ID: `${SERVICE_ID}-backfill-message-processor`,
        },
        timeout: '30 seconds',
      },
      {
        batch: {
          partialResponses: true,
        },
      },
    );

    new sst.aws.Function(`${SERVICE_NAME}BackfillMessagePublisher`, {
      handler: 'handler.publishBackfillMessages',
      link: [backfillWriteQueue, secrets.AccNumber, secrets.ApiKey],
      name: `${$app.stage}--${SERVICE_ID}-backfill-publisher`,
      timeout: '5 minutes',
      environment: {
        SERVICE_ID: `${SERVICE_ID}-backfill-message-publisher`,
        BACKFILL_FROM_DATE: '2025-01-01',
      },
    });
  },
});
