import SparkPost from 'sparkpost';
import { sendEmail } from '../email';
import { server } from '../../mocks/node';

const sendMock = vi.fn();

vi.mock('sparkpost', () => ({
  default: vi.fn(() => ({
    transmissions: {
      send: sendMock,
    },
  })),
}));

describe('Email', () => {
  afterEach(() => {
    sendMock.mockReset();
  });

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
        cost: 100,
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
    await sendEmail({
      emailType: 'CHEAPER_TARIFF_EXISTS',
      allTariffsByCost: [],
      currentTariffWithCost: {
        id: 'agile',
        displayName: 'Agile Octopus',
        tariffCodeMatcher: '-AGILE-',
        cost: 100,
      },
    });

    expect(SparkPost).toHaveBeenCalledWith('SparkPostApiKey', {
      origin: 'https://api.eu.sparkpost.com:443',
    });
  });

  it('should send an email when a cheaper tariff exists', async () => {
    await sendEmail({
      emailType: 'CHEAPER_TARIFF_EXISTS',
      allTariffsByCost: [
        {
          cost: 95,
          displayName: 'Octopus Cosy',
          id: 'cosy',
          tariffCodeMatcher: '-COSY-',
        },
        {
          id: 'agile',
          displayName: 'Agile Octopus',
          tariffCodeMatcher: '-AGILE-',
          cost: 105,
        },
      ],
      currentTariffWithCost: {
        id: 'agile',
        displayName: 'Agile Octopus',
        tariffCodeMatcher: '-AGILE-',
        cost: 105,
      },
    });

    expect(sendMock.mock.calls).toMatchSnapshot();
  });

  it('should send an email when there is no cheaper tariff', async () => {
    await sendEmail({
      emailType: 'ALREADY_ON_CHEAPEST_TARIFF',
      allTariffsByCost: [
        {
          cost: 105,
          displayName: 'Octopus Cosy',
          id: 'cosy',
          tariffCodeMatcher: '-COSY-',
        },
        {
          id: 'agile',
          displayName: 'Agile Octopus',
          tariffCodeMatcher: '-AGILE-',
          cost: 65,
        },
      ],
      currentTariffWithCost: {
        id: 'agile',
        displayName: 'Agile Octopus',
        tariffCodeMatcher: '-AGILE-',
        cost: 65,
      },
    });

    expect(sendMock.mock.calls).toMatchSnapshot();
  });

  it('should send an email when it is not worth switching tariff', async () => {
    await sendEmail({
      emailType: 'NOT_WORTH_SWITCHING_TARIFF',
      allTariffsByCost: [
        {
          cost: 99,
          displayName: 'Octopus Cosy',
          id: 'cosy',
          tariffCodeMatcher: '-COSY-',
        },
        {
          id: 'agile',
          displayName: 'Agile Octopus',
          tariffCodeMatcher: '-AGILE-',
          cost: 100,
        },
      ],
      currentTariffWithCost: {
        id: 'agile',
        displayName: 'Agile Octopus',
        tariffCodeMatcher: '-AGILE-',
        cost: 100,
      },
    });

    expect(sendMock.mock.calls).toMatchSnapshot();
  });
});
