import { server } from '../src/mocks/node';

vi.stubEnv('API_KEY', 'API_KEY');
vi.stubEnv('ACC_NUMBER', 'A-123456');
vi.stubEnv('POWERTOOLS_LOG_LEVEL', 'silent');

vi.mock('sst', () => {
  return {
    Resource: {
      ApiKey: {
        value: 'API_KEY',
      },
      AccNumber: {
        value: 'A-123456',
      },
    },
  };
});

beforeAll(() => {
  server.listen();
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
