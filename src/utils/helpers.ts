import { TZDateMini } from '@date-fns/tz';
import type { IsoDate, IsoDateTime } from '../types/misc';

export function getDateFromApiIsoString(isoStringFromApi: string) {
  return new Date(isoStringFromApi.replace('+00:00', '.000Z'));
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
