import { penceToPoundWithCurrency } from './helpers';
import type { TariffContextWithCost } from '../types/tariff';

type TemplateData = {
  allTariffsByCost: TariffContextWithCost[];
  currentTariffWithCost: TariffContextWithCost;
  title: string;
};

type CommonTariffTemplate = {
  content: string;
  imageUrl: string;
} & Omit<TemplateData, 'currentTariffWithCost'>;

function wrapperEmailTemplate(content: string) {
  const htmlOutput = `
    <mjml>
      <mj-body background-color="white">
        <mj-section background-color="#f0f0f0">
          <mj-column width="15%" vertical-align="middle">
            <mj-image src="https://i.postimg.cc/v4fmRR64/businessman.png"></mj-image>
          </mj-column>
          <mj-column width="85%" vertical-align="middle">
        <mj-text font-style="bold" font-size="24px" color="#525252" font-family="Helvetica Neue">Octopus Tariff Switcher</mj-text>
       </mj-column>
      </mj-section>
        ${content}
      </mj-body>
    </mjml>
  `;

  return htmlOutput;
}

function getCommonTariffTemplate({
  allTariffsByCost,
  title,
  content,
  imageUrl,
}: CommonTariffTemplate) {
  const htmlOutput = `
    <mj-section>
      <mj-column width="60%">
        <mj-text font-style="bold" font-size="24px" line-height="30px" font-family="Helvetica Neue" color="#525252">${title}.</mj-text>
          <mj-table font-size="16px" line-height="24px" font-family="Helvetica Neue" color="#525252">
            <tr style="border-bottom:1px solid #ecedee;text-align:left;padding:15px 0;">
              <th style="padding: 8px">Tariff</th>
              <th style="padding: 8px">Cost</th>
            </tr>
            ${allTariffsByCost
              .map((tariff, index) => {
                const rowHighlight = index % 2 === 0 ? 'style="background-color:#f0f0f0"' : '';

                return `
                <tr ${rowHighlight}>
                  <td style="padding: 8px">${tariff.displayName}</td>
                  <td style="padding: 8px">${penceToPoundWithCurrency(tariff.cost)}</td>
                </tr>
              `;
              })
              .join('')}
          </mj-table>
          ${content}
        </mj-column>
        <mj-column width="40%">
          <mj-image src="${imageUrl}"></mj-image>
        </mj-column>
      </mj-section>
  `;

  return wrapperEmailTemplate(htmlOutput);
}

export function getCheaperTariffTemplate({
  allTariffsByCost,
  currentTariffWithCost,
  title,
}: TemplateData) {
  const cheapestTariff = allTariffsByCost.at(0) ?? currentTariffWithCost;
  const saving = penceToPoundWithCurrency(currentTariffWithCost.cost - cheapestTariff.cost);

  const htmlOutput = getCommonTariffTemplate({
    allTariffsByCost,
    title,
    content: `
      <mj-text font-size="16px" line-height="24px" padding-top="20px" color="#525252">
        You are currently on ${currentTariffWithCost.displayName}. I have automatically switched to ${cheapestTariff.displayName} as it is cheaper.
      </mj-text>
      <mj-text font-size="16px" line-height="24px" padding-top="10px" color="#525252">
        You will pay ${penceToPoundWithCurrency(cheapestTariff.cost)} versus ${penceToPoundWithCurrency(currentTariffWithCost.cost)}, saving ${saving}.
      </mj-text>
    `,
    imageUrl: 'https://i.postimg.cc/y8DtP8TQ/robot-cheaper-tariff.png',
  });

  return htmlOutput;
}

export function getAlreadyCheapestTariffTemplate({
  allTariffsByCost,
  currentTariffWithCost,
  title,
}: TemplateData) {
  const htmlOutput = getCommonTariffTemplate({
    allTariffsByCost,
    title,
    content: `
      <mj-text font-size="16px" line-height="24px" padding-top="20px" color="#525252">
        You are currently on ${currentTariffWithCost.displayName}. It isn't worth switching as the other tariffs are more expensive.
      </mj-text>
    `,
    imageUrl: 'https://i.postimg.cc/NfJZmHR2/robot-already-on-cheapest.png',
  });

  return htmlOutput;
}

export function notWorthSwitchingTariffTemplate({
  allTariffsByCost,
  currentTariffWithCost,
  title,
}: TemplateData) {
  const htmlOutput = getCommonTariffTemplate({
    allTariffsByCost,
    title,
    content: `
      <mj-text font-size="16px" line-height="24px" padding-top="20px" color="#525252">
        You are currently on ${currentTariffWithCost.displayName}. It isn't worth switching to the other tariffs as the saving is too little.
      </mj-text>
    `,
    imageUrl: 'https://i.postimg.cc/JzSgdC61/robot-not-worth-sw-itching.png',
  });

  return htmlOutput;
}
