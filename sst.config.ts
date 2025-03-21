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

    new sst.aws.Function('OctopusTariffSwitcher', {
      handler: 'handler.tariffSwitcher',
      runtime: 'nodejs22.x',
      link: [...allSecrets],
      name: `${$app.stage}--${SERVICE_NAME}`,
      url: true,
      environment: {
        SERVICE_NAME,
        POWERTOOLS_DEV: String($dev),
        DRY_RUN: String($dev),
      },
      logging: {
        format: 'json',
      },
    });
  },
});
