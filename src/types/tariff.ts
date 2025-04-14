import type { IsoDate, Url } from './misc';

export type TariffSelector = {
  tariffCode: string;
  productCode: string;
};

export type UnitRatesTariffSelector =
  | (TariffSelector & { isoDate?: IsoDate })
  | { url: Url; isoDate?: IsoDate };

export type Tariff = {
  id: string;
  displayName: string;
  tariffCodeMatcher: string;
};

export type TariffWithCost = Tariff & { cost: number };
