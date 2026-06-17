import { Resource } from 'sst';
import { z } from 'zod';
import { API_MJML } from '../constants/api';
import type { SendEmail } from '../types/email';
import { sendData } from '../utils/fetch';
import { logger } from '../utils/logger';
import {
  getAlreadyCheapestTariffTemplate,
  getCheaperTariffTemplate,
  notWorthSwitchingTariffTemplate,
} from './email-template';
import { sendSparkPostEmail } from './sparkpost';

async function getHtml(content: string) {
  const mjmlAuth = `${Resource.MjmlAppId.value}:${Resource.MjmlSecretKey.value}`;

  logger.info(`API: Getting email template data via ${API_MJML}`);

  const schema = z.object({
    html: z.string(),
  });

  const results = await sendData({
    url: API_MJML,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(mjmlAuth)}`,
    },
    body: { mjml: content },
  });

  const { html } = schema.parse(results);

  logger.info('API Response: Received email template data');

  return html;
}

export async function sendEmail({ allTariffsByCost, currentTariffWithCost, emailType }: SendEmail) {
  let emailSubject: string;
  let emailContent: string;

  switch (emailType) {
    case 'CHEAPER_TARIFF_EXISTS':
      emailSubject = 'Cheaper Tariff Found';
      emailContent = getCheaperTariffTemplate({
        allTariffsByCost,
        currentTariffWithCost,
        title: emailSubject,
      });
      break;
    case 'ALREADY_ON_CHEAPEST_TARIFF':
      emailSubject = 'You are already on the cheapest tariff';
      emailContent = getAlreadyCheapestTariffTemplate({
        allTariffsByCost,
        currentTariffWithCost,
        title: emailSubject,
      });
      break;
    case 'NOT_WORTH_SWITCHING_TARIFF':
      emailSubject = 'Not worth switching tariff';
      emailContent = notWorthSwitchingTariffTemplate({
        allTariffsByCost,
        currentTariffWithCost,
        title: emailSubject,
      });
      break;
  }

  const html = await getHtml(emailContent);

  return sendSparkPostEmail({ html, subject: emailSubject });
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Build HTML manually and bypass MJML, incase the MJML API call itself be the
// thing that fails.
export function sendFailureEmail(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  const html = `
    <html>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #525252;">
        <h2>Octopus Tariff Switcher failed</h2>
        <p>The nightly run did not complete successfully. The error was:</p>
        <pre style="background:#f0f0f0;padding:12px;border-radius:4px;white-space:pre-wrap;">${escapeHtml(message)}</pre>
      </body>
    </html>
  `;

  return sendSparkPostEmail({ html, subject: 'Tariff Switcher Failed' });
}
