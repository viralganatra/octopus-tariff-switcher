import { chunkArray } from '../batch';

describe('chunkArray', () => {
  it('should split an array into evenly sized chunks', () => {
    expect(chunkArray([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('should put the remainder in a final smaller chunk', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('should return a single chunk when size exceeds the array length', () => {
    expect(chunkArray([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });

  it('should return an empty array for an empty input', () => {
    expect(chunkArray([], 5)).toEqual([]);
  });
});
