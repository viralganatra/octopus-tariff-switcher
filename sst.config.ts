/// <reference path="./.sst/platform/config.d.ts" />

const SERVICE_NAME = 'octopus-tariff-switcher';
const AWS_REGION = 'eu-west-2';

export default $config({
  app(input) {
    return {
      name: SERVICE_NAME,
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
    const secrets = {
      AccNumber: new sst.Secret('AccNumber'),
      ApiKey: new sst.Secret('ApiKey'),
      SparkPostApiKey: new sst.Secret('SparkPostApiKey'),
      EmailFrom: new sst.Secret('EmailFrom'),
      MjmlAppId: new sst.Secret('MjmlAppId'),
      MjmlSecretKey: new sst.Secret('MjmlSecretKey'),
    };

    const allSecrets = Object.values(secrets);

    new sst.aws.Cron('OctopusTariffSwitcher', {
      schedule: 'cron(45 22 * * ? *)',
      job: {
        handler: 'handler.tariffSwitcher',
        runtime: 'nodejs22.x',
        link: [...allSecrets],
        name: `${$app.stage}--${SERVICE_NAME}`,
        timeout: '70 seconds',
        url: true,
        environment: {
          SERVICE_NAME,
          POWERTOOLS_DEV: String($dev),
          DRY_RUN: String($dev),
        },
        logging: {
          format: 'json',
        },
      },
    });

    new sst.aws.Function('OctopusTariffSwitcherBackfill', {
      handler: 'handler.backfill',
      runtime: 'nodejs22.x',
      link: [secrets.AccNumber, secrets.ApiKey],
      name: `${$app.stage}--${SERVICE_NAME}-backfill`,
      timeout: '5 minutes',
      url: true,
      environment: {
        SERVICE_NAME,
        POWERTOOLS_DEV: String($dev),
        BACKFILL_FROM_DATE: '2025-04-06',
      },
      logging: {
        format: 'json',
      },
    });
  },
});
