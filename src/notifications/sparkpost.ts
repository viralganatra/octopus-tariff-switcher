import SparkPost from 'sparkpost';
import { Resource } from 'sst';
import { logger } from '../utils/logger';

export async function sendSparkPostEmail({ subject, html }: SparkPost.InlineContent) {
  const emailClient = new SparkPost(Resource.SparkPostApiKey.value, {
    origin: 'https://api.eu.sparkpost.com:443',
  });

  logger.info('API: Sending SparkPost email', {
    data: subject,
  });

  return emailClient.transmissions.send({
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
  });
}
