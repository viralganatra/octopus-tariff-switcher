import type { Tariff } from '../types/tariff';

export const TARIFFS = [
  {
    id: 'agile',
    displayName: 'Agile Octopus',
    tariffCodeMatcher: '-AGILE-',
  },
  {
    id: 'cosy',
    displayName: 'Cosy Octopus',
    tariffCodeMatcher: '-COSY-',
  },
  {
    id: 'go',
    displayName: 'Octopus Go',
    tariffCodeMatcher: '-GO-',
  },
] as const satisfies Tariff[];

export type TariffDisplayName = (typeof TARIFFS)[number]['displayName'];
export type TariffId = (typeof TARIFFS)[number]['id'];
