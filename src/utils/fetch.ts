import { FetchError } from '../errors/fetch-error';

export async function getData(url: string) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new FetchError(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function sendData({
  url,
  body,
  headers,
}: { url: string; body: Record<string, string>; headers?: Record<string, string> }) {
  const response = await fetch(url, {
    headers,
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new FetchError(`Request failed with status ${response.status}`);
  }

  return response.json();
}
