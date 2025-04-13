import { server } from '../../../mocks/node';
import { toIsoDateString } from '../../../utils/helpers';
import { fetchAllProducts, fetchToken, fetchUnitRatesByTariff } from '../queries';

describe('Queries', () => {
  it('should return a token from the api or reuse it if it exists', async () => {
    const dispatchRequest = vi.fn();
    server.events.on('request:start', dispatchRequest);

    const token = await fetchToken();
    await fetchToken();
    await fetchToken();

    expect(token).toBe('foo');
    expect(dispatchRequest).toHaveBeenCalledOnce();

    const serverRequest = dispatchRequest.mock.lastCall?.at(0).request;

    await expect(serverRequest.json()).resolves.toMatchInlineSnapshot(`
      {
        "query": "
          mutation ObtainKrakenToken($input: ObtainJSONWebTokenInput!) {
            obtainKrakenToken(input: $input) {
              token
            }
          }
        ",
        "variables": {
          "input": {
            "APIKey": "API_KEY",
          },
        },
      }
    `);

    expect(serverRequest.url).toBe('https://api.octopus.energy/v1/graphql/');
  });

  it('should use the date param or today when fetching unit rates by tariff', async () => {
    await expect(
      fetchUnitRatesByTariff({
        tariffCode: 'E-1R-AGILE-18-02-21-A',
        productCode: 'AGILE-18-02-21',
      }),
    ).resolves.toMatchSnapshot();

    await expect(
      fetchUnitRatesByTariff({
        tariffCode: 'E-1R-AGILE-18-02-21-A',
        productCode: 'AGILE-18-02-21',
        isoDate: toIsoDateString('2020-01-01'),
      }),
    ).resolves.toMatchSnapshot();
  });

  it('should only fetch the list of all products once', async () => {
    const dispatchRequest = vi.fn();
    server.events.on('request:start', dispatchRequest);

    await fetchAllProducts();
    await fetchAllProducts();
    await fetchAllProducts();

    expect(dispatchRequest).toHaveBeenCalledOnce();
  });
});
