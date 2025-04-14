import { server } from '../../../mocks/node';
import { fetchAllProducts, fetchToken, fetchUnitRatesByTariff } from '../queries';

describe('Queries', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date(2025, 2, 3));
  });

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

  it('should only fetch the list of all products once', async () => {
    const dispatchRequest = vi.fn();
    server.events.on('request:start', dispatchRequest);

    await fetchAllProducts();
    await fetchAllProducts();
    await fetchAllProducts();

    expect(dispatchRequest).toHaveBeenCalledOnce();
  });

  it('should fetch todays unit rates', async () => {
    const dispatchRequest = vi.fn();
    server.events.on('request:start', dispatchRequest);

    await fetchUnitRatesByTariff({
      tariffCode: 'E-1R-AGILE-18-02-21-A',
      productCode: 'AGILE-18-02-21',
    });

    const serverRequest = dispatchRequest.mock.lastCall?.at(0).request;

    expect(serverRequest.url).toBe(
      'https://api.octopus.energy/v1/products/AGILE-18-02-21/electricity-tariffs/E-1R-AGILE-18-02-21-A/standard-unit-rates/?period_from=2025-03-03T00:00:00Z&period_to=2025-03-03T23:59:59Z',
    );
  });
});
