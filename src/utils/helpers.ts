export function getMsFromApiIsoString(isoStringFromApi: string) {
  return new Date(isoStringFromApi.replace('+00:00', '.000Z')).getTime();
}

export function roundTo4Digits(num: number) {
  return Math.round(num * 1e4) / 1e4;
}

export function roundTo2Digits(num: number) {
  return Math.round(num * 1e2) / 1e2;
}
