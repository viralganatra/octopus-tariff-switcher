import { Resource } from 'sst';
import { logger } from '../utils/logger';
import { sendData } from '../utils/fetch';
import { makeUrl } from '../utils/helpers';

export async function sendSparkPostEmail({ subject, html }: { subject: string; html: string }) {
  const url = makeUrl('https://api.eu.sparkpost.com:443/api/v1/transmissions');

  logger.info('API: Sending SparkPost email', {
    data: subject,
  });

  return sendData({
    url,
    headers: {
      Authorization: Resource.SparkPostApiKey.value,
    },
    body: {
      content: {
        html,
        subject: `Octopus Tariff Switcher: ${subject}`,
        from: {
          email: Resource.EmailFrom.value,
          name: 'Octobot',
        },
      },
      options: {
        transactional: true,
      },
      recipients: {
        list_id: 'octopus-tariff-switcher',
      },
    },
  });
}
