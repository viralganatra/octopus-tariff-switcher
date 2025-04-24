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
      args.url ??= true;
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

    const backfillWriteFifoDLQ = new sst.aws.Queue(`${SERVICE_NAME}WriteFifoDLQ`, {
      fifo: true,
    });

    const backfillWriteFifoQueue = new sst.aws.Queue(`${SERVICE_NAME}WriteFifoQueue`, {
      fifo: true,
      dlq: backfillWriteFifoDLQ.arn,
      visibilityTimeout: '5 seconds',
    });

    new sst.aws.Function(`${SERVICE_NAME}BackfillMessagePublisher`, {
      handler: 'handler.publishBackfillMessages',
      link: [backfillWriteFifoQueue, secrets.AccNumber, secrets.ApiKey],
      name: `${$app.stage}--${SERVICE_ID}-backfill-message-publisher`,
      timeout: '5 minutes',
      environment: {
        SERVICE_ID: `${SERVICE_ID}-backfill-message-publisher`,
        BACKFILL_FROM_DATE: '2025-01-01',
      },
    });
  },
});
