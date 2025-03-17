export type TariffSelector = {
  tariffCode: string;
  productCode: string;
};

export type TariffSelectorWithUrl = TariffSelector | { url: string };

export type TariffContext = {
  id: string;
  displayName: string;
  tariffCodeMatcher: string;
};

export type TariffContextWithCost = TariffContext & { cost: number };
