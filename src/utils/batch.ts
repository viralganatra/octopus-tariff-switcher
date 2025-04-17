import { sleep } from './helpers';

// Split an array of items into multiple batches,
// e.g. [1, 2, 3, 4, 5] -> [[1, 2], [3, 4], [5]]
export function chunkArray<T>(arr: T[], size: number): T[][] {
  return arr.length === 0 ? [] : [arr.slice(0, size), ...chunkArray(arr.slice(size), size)];
}

// Process batches of items, with a delay between each batch
export async function processBatches<T, R>({
  batches,
  processBatchItem,
  delayMs = 500,
}: {
  batches: T[][];
  processBatchItem: (item: T) => Promise<R>;
  delayMs?: number;
}) {
  const results: R[] = [];

  async function process(index: number) {
    if (index >= batches.length) {
      return;
    }

    const batch = batches[index];

    if (!batch) {
      throw new Error(`No batch at index ${index}`);
    }

    const batchResults = await Promise.all(batch.map(processBatchItem));

    results.push(...batchResults);

    if (index < batches.length - 1) {
      await sleep(delayMs);
      return process(index + 1);
    }
  }

  await process(0);

  return results;
}
