export function getMsFromApiIsoString(isoStringFromApi: string) {
  return new Date(isoStringFromApi.replace('+00:00', '.000Z')).getTime();
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

export function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
