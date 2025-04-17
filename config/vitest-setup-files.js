import { server } from '../src/mocks/node';

vi.stubEnv('POWERTOOLS_LOG_LEVEL', 'silent');
vi.stubEnv('DRY_RUN', 'false');

vi.mock('sst', () => {
  return {
    Resource: {
      ApiKey: {
        value: 'API_KEY',
      },
      AccNumber: {
        value: 'A-123456',
      },
      SparkPostApiKey: {
        value: 'SparkPostApiKey',
      },
      EmailFrom: {
        value: 'EmailFrom',
      },
      MjmlAppId: {
        value: 'MjmlAppId',
      },
      MjmlSecretKey: {
        value: 'MjmlSecretKey',
      },
    },
  };
});

vi.mock('sparkpost', () => ({
  default: vi.fn(() => ({
    transmissions: {
      send: vi.fn(),
    },
  })),
}));

beforeAll(() => {
  server.listen();
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllTimers();
});

afterEach(() => {
  vi.useRealTimers();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
