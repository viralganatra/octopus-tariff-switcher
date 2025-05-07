import { sendEmail } from '../email';
import { server } from '../../mocks/node';

describe('Email', () => {
  it('call the email render api with the correct data', async () => {
    const dispatchRequest = vi.fn();

    server.events.on('request:start', dispatchRequest);

    await sendEmail({
      emailType: 'CHEAPER_TARIFF_EXISTS',
      allTariffsByCost: [],
      currentTariffWithCost: {
        id: 'agile',
        displayName: 'Agile Octopus',
        tariffCodeMatcher: '-AGILE-',
        costInPence: 100,
      },
    });

    // @ts-ignore
    const serverRequest = dispatchRequest.mock.calls[0][0].request;

    expect(serverRequest.url).toBe('https://api.mjml.io/v1/render');
    expect(serverRequest.headers.get('content-type')).toBe('application/x-www-form-urlencoded');
    expect(serverRequest.headers.get('authorization')).toBe(
      'Basic TWptbEFwcElkOk1qbWxTZWNyZXRLZXk=',
    );
  });

  it('should call the sparkpost api with the correct data', async () => {
    const result = (await sendEmail({
      emailType: 'CHEAPER_TARIFF_EXISTS',
      allTariffsByCost: [],
      currentTariffWithCost: {
        id: 'agile',
        displayName: 'Agile Octopus',
        tariffCodeMatcher: '-AGILE-',
        costInPence: 100,
      },
    })) as { url: string; headers: { Authorization: string } };

    expect(result.url).toBe('https://api.eu.sparkpost.com/api/v1/transmissions');
    expect(result.headers.Authorization).toBe('SparkPostApiKey');
  });

  it('should send an email when a cheaper tariff exists', async () => {
    const result = (await sendEmail({
      emailType: 'CHEAPER_TARIFF_EXISTS',
      allTariffsByCost: [
        {
          costInPence: 95,
          displayName: 'Octopus Cosy',
          id: 'cosy',
          tariffCodeMatcher: '-COSY-',
        },
        {
          id: 'agile',
          displayName: 'Agile Octopus',
          tariffCodeMatcher: '-AGILE-',
          costInPence: 105,
        },
      ],
      currentTariffWithCost: {
        id: 'agile',
        displayName: 'Agile Octopus',
        tariffCodeMatcher: '-AGILE-',
        costInPence: 105,
      },
    })) as { data: object };

    expect(result.data).toMatchSnapshot();
  });

  it('should send an email when there is no cheaper tariff', async () => {
    const result = (await sendEmail({
      emailType: 'ALREADY_ON_CHEAPEST_TARIFF',
      allTariffsByCost: [
        {
          costInPence: 105,
          displayName: 'Octopus Cosy',
          id: 'cosy',
          tariffCodeMatcher: '-COSY-',
        },
        {
          id: 'agile',
          displayName: 'Agile Octopus',
          tariffCodeMatcher: '-AGILE-',
          costInPence: 65,
        },
      ],
      currentTariffWithCost: {
        id: 'agile',
        displayName: 'Agile Octopus',
        tariffCodeMatcher: '-AGILE-',
        costInPence: 65,
      },
    })) as { data: object };

    expect(result.data).toMatchSnapshot();
  });

  it('should send an email when it is not worth switching tariff', async () => {
    const result = (await sendEmail({
      emailType: 'NOT_WORTH_SWITCHING_TARIFF',
      allTariffsByCost: [
        {
          costInPence: 99,
          displayName: 'Octopus Cosy',
          id: 'cosy',
          tariffCodeMatcher: '-COSY-',
        },
        {
          id: 'agile',
          displayName: 'Agile Octopus',
          tariffCodeMatcher: '-AGILE-',
          costInPence: 100,
        },
      ],
      currentTariffWithCost: {
        id: 'agile',
        displayName: 'Agile Octopus',
        tariffCodeMatcher: '-AGILE-',
        costInPence: 100,
      },
    })) as { data: object };

    expect(result.data).toMatchSnapshot();
  });
});
