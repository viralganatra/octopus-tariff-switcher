import { FetchError } from '../errors/fetch-error';
import type { HeadersInit, Url } from '../types/misc';
import { sleep } from './helpers';

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
}: { url: Url; body: Record<string, string>; headers?: HeadersInit }) {
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

export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  { retries = 3, delayMs = 250 }: { retries?: number; delayMs?: number } = {},
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
