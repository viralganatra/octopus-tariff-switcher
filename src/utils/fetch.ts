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

  return await response.json();
}
