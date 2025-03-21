import type { TariffContextWithCost } from './tariff';

export type EmailType =
  | 'CHEAPER_TARIFF_EXISTS'
  | 'ALREADY_ON_CHEAPEST_TARIFF'
  | 'NOT_WORTH_SWITCHING_TARIFF';

export type SendEmail = {
  allTariffsByCost: TariffContextWithCost[];
  currentTariffWithCost: TariffContextWithCost;
  emailType: EmailType;
};
