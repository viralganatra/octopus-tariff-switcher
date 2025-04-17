import { TZDateMini } from '@date-fns/tz';
import type { IsoDate, IsoDateTime, Url } from '../types/misc';

export function getDateFromApiIsoString(isoStringFromApi: string) {
  return new Date(isoStringFromApi);
}

export function getMsFromApiIsoString(isoStringFromApi: string) {
  return getDateFromApiIsoString(isoStringFromApi).getTime();
}

export function getDateInLocalTimeZone(date: Date) {
  return new TZDateMini(date).withTimeZone('Europe/London');
}

export function roundTo4Digits(num: number) {
  return Math.round(num * 1e4) / 1e4;
}

export function roundTo2Digits(num: number) {
  return Math.round(num * 1e2) / 1e2;
}

export function penceToPoundWithCurrency(num: number) {
  return `£${roundTo2Digits(num / 100).toFixed(2)}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toIsoDateString(input: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    throw new Error('Invalid ISO date format');
  }
  return input as IsoDate;
}

export function toIsoDateTime(input: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(input)) {
    throw new Error('Invalid ISO 8601 datetime format');
  }
  return input as IsoDateTime;
}

export function makeUrl(value: string): Url {
  try {
    new URL(value);
    return value as Url;
  } catch {
    throw new Error(`Invalid URL: ${value}`);
  }
}

export function scrubKeys<T>({ data, keysToScrub }: { data: T; keysToScrub: string[] }): T {
  const SCRUBBED_VALUE = '[SCRUBBED]';

  if (Array.isArray(data)) {
    return data.map((item) => scrubKeys({ data: item, keysToScrub })) as T;
  }

  if (data !== null && typeof data === 'object') {
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(data)) {
      const value = (data as Record<string, unknown>)[key];

      if (keysToScrub.includes(key)) {
        result[key] = SCRUBBED_VALUE;
      } else {
        result[key] = scrubKeys({ data: value, keysToScrub });
      }
    }

    return result as T;
  }

  return data;
}
