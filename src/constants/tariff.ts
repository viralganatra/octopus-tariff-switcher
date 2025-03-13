import type { TariffContext } from '../types/tariff';

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
] as const satisfies TariffContext[];
