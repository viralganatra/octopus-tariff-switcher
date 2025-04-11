import type { IsoDate, Url } from './misc';

export type TariffSelector = {
  tariffCode: string;
  productCode: string;
};

export type UnitRatesTariffSelector =
  | (TariffSelector & { isoDate?: IsoDate })
  | { url: Url; isoDate?: IsoDate };

export type TariffContext = {
  id: string;
  displayName: string;
  tariffCodeMatcher: string;
};

export type TariffContextWithCost = TariffContext & { cost: number };
