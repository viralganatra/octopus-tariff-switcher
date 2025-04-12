import { FetchError } from '../errors/fetch-error';
import type { HeadersInit, Url } from '../types/misc';

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
