import { z } from 'zod';
import { Resource } from 'sst';
import { API_MJML } from '../constants/api';
import { sendData } from '../utils/fetch';
import {
  getAlreadyCheapestTariffTemplate,
  getCheaperTariffTemplate,
  notWorthSwitchingTariffTemplate,
} from '../utils/email-template';
import { sendSparkPostEmail } from './sparkpost';
import { logger } from '../utils/logger';
import type { TariffContextWithCost } from '../types/tariff';
import type { EmailType } from '../types/email';

type SendEmail = {
  allTariffsByCost: TariffContextWithCost[];
  currentTariffWithCost: TariffContextWithCost;
  emailType: EmailType;
};

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
