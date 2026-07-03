import { describe, it, expect } from 'vitest';
import { filterUniqueObjects } from './utils.js';

describe('filterUniqueObjects', () => {
  it('removes duplicate objects by JSON equality', () => {
    const arr = [
      { a: 1, b: 2 },
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ];
    const result = filterUniqueObjects(arr);
    expect(result).toEqual([{ a: 1, b: 2 }, { a: 3, b: 4 }]);
  });

  it('returns empty array for empty input', () => {
    expect(filterUniqueObjects([])).toEqual([]);
  });
});
