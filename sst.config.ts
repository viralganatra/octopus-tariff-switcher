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
      },
      logging: {
        format: 'json',
      },
    });
  },
});
