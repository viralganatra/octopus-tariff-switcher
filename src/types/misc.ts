import type { Branded } from './helpers';

export type IsoDate = Branded<string, 'IsoDate'>;
export type IsoDateTime = Branded<string, 'IsoDateTime'>;
export type Url = Branded<string, 'Url'>;

export type HeadersInit = Record<string, string> | [string, string][] | Headers;
