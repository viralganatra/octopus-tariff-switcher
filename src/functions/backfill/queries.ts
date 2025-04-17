import { Resource } from 'sst';
import { API, API_ACCOUNTS, API_PRODUCTS } from '../../constants/api';
import { logger } from '../../utils/logger';
import { getData } from '../../utils/fetch';
import { makeUrl, scrubKeys, roundTo4Digits } from '../../utils/helpers';
import type { TariffSelectorWithDate } from '../../types/tariff';
import { schemaConsumption, schemaPastTariffs, schemaStandingCharge } from './schema';
import { fetchToken } from '../tariff-switcher/queries';
import type { IsoDate } from '../../types/misc';

export async function fetchAllPastTariffs() {
  const token = await fetchToken();

  logger.info('API: Getting past tariffs');

  const result = await getData({
    url: makeUrl(`${API_ACCOUNTS}/${Resource.AccNumber.value}/`),
    headers: {
      authorization: token,
    },
  });

  const scrubbedResult = scrubKeys({
    data: result,
    keysToScrub: [
      'moved_in_at',
      'moved_out_at',
      'address_line_1',
      'address_line_2',
      'address_line_3',
      'town',
      'county',
      'postcode',
    ],
  });

  logger.info('API Response: Recieved past tariffs', { apiResponse: scrubbedResult });

  const results = schemaPastTariffs.parse(scrubbedResult);

  const { agreements } = results.properties[0].electricityMeterPoints[0];

  return agreements;
}

export async function fetchConsumption({
  mpan,
  serialNumber,
  isoDate,
}: { mpan: string; serialNumber: string; isoDate: IsoDate }) {
  const token = await fetchToken();

  const params = {
    period_from: `${isoDate}T00:00:00Z`,
    period_to: `${isoDate}T23:59:59Z`,
    order_by: 'period',
  };

  const queryParams = new URLSearchParams(params).toString();

  const url = makeUrl(
    `${API}electricity-meter-points/${mpan}/meters/${serialNumber}/consumption/?${queryParams}`,
  );

  logger.info('API: Getting consumption', {
    data: { url, date: isoDate },
  });

  const result = await getData({
    url,
    headers: {
      authorization: token,
    },
  });

  logger.info('API Response: Recieved consumption', {
    date: isoDate,
    apiResponse: result,
  });

  const { results } = schemaConsumption.parse(result);

  return results;
}

export async function fetchStandingCharge({
  productCode,
  tariffCode,
  isoDate,
}: TariffSelectorWithDate) {
  const token = await fetchToken();

  const params = {
    period_from: `${isoDate}T00:00:00Z`,
    period_to: `${isoDate}T23:59:59Z`,
  };

  const queryParams = new URLSearchParams(params).toString();

  const url = makeUrl(
    `${API_PRODUCTS}/${productCode}/electricity-tariffs/${tariffCode}/standing-charges/?${queryParams}`,
  );

  logger.info('API: Getting standing charge', {
    data: { productCode, tariffCode, isoDate },
  });

  const result = await getData({
    url,
    headers: {
      authorization: token,
    },
  });

  logger.info('API Response: Recieved standing charge', {
    data: { productCode, tariffCode, isoDate },
    apiResponse: result,
  });

  const { results } = schemaStandingCharge.parse(result);

  return roundTo4Digits(results[0].valueIncVat);
}
