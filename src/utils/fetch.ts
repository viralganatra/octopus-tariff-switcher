import { API_GRAPHQL } from '../constants/api';
import { FetchError } from '../errors/fetch-error';
import type { HeadersInit, Url } from '../types/misc';
import { chunkArray } from './batch';
import { sleep } from './helpers';
import { logger } from './logger';

type RetryOptions = {
  retries?: number;
  delayMs?: number;
};

export async function getData({ url, headers = {} }: { url: Url; headers?: HeadersInit }) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!response.ok) {
    throw new FetchError(`Request failed with status ${response.status} at url ${url}`);
  }

  return response.json();
}

export async function sendData({
  url,
  body,
  headers = {},
}: {
  url: Url;
  body: Record<string, string | object>;
  headers?: HeadersInit;
}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new FetchError(`Request failed with status ${response.status} at url ${url}`);
  }

  return response.json();
}

export async function graphqlRequest<T>({
  query,
  variables,
  headers = {},
}: {
  query: string;
  variables?: Record<string, unknown>;
  headers?: HeadersInit;
}): Promise<T> {
  const response = await fetch(API_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new FetchError(`Request failed with status ${response.status} at url ${API_GRAPHQL}`);
  }

  const { data, errors } = (await response.json()) as {
    data: T;
    errors?: { message: string }[];
  };

  if (errors?.length) {
    throw new FetchError(`GraphQL error: ${errors.map((error) => error.message).join('; ')}`);
  }

  return data;
}

export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  { retries = 3, delayMs = 250 }: RetryOptions = {},
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }

      const delay = delayMs * 2 ** attempt + Math.random() * 100;

      await sleep(delay);
    }
  }

  // Shouldn't be reachable
  throw new Error('Unexpected error in retry logic');
}

export async function batchWithRetry<T>({
  entries,
  batchSize,
  sendBatch,
  retryOptions,
}: {
  entries: T[];
  batchSize: number;
  sendBatch: (batch: T[]) => Promise<{ failed: T[]; reason: string }>;
  retryOptions?: RetryOptions;
}) {
  const batches = chunkArray(entries, batchSize);

  for (const batch of batches) {
    await retryWithExponentialBackoff(async () => {
      const { failed, reason } = await sendBatch(batch);

      if (failed.length === 0) {
        await sleep(1000);
        return;
      }

      logger.warn(`Retrying ${failed.length} failed items`);
      batch.length = 0;
      batch.push(...failed);

      throw new Error(`Batch retry triggered: ${reason}`);
    }, retryOptions);
  }
}
