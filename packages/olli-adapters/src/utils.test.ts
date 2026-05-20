import { describe, it, expect } from 'vitest';
import { filterUniqueObjects, inferFormatFromUrl, parseCsv } from './utils.js';

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

describe('inferFormatFromUrl', () => {
  it('returns csv for .csv files', () => {
    expect(inferFormatFromUrl('data/file.csv')).toBe('csv');
  });

  it('returns csv for .tsv files', () => {
    expect(inferFormatFromUrl('data/file.tsv')).toBe('csv');
  });

  it('returns json for .json files', () => {
    expect(inferFormatFromUrl('data/file.json')).toBe('json');
  });

  it('returns json for unknown extensions', () => {
    expect(inferFormatFromUrl('data/file.txt')).toBe('json');
  });
});

describe('parseCsv', () => {
  it('parses basic CSV', () => {
    const csv = 'a,b\n1,2\n3,4';
    expect(parseCsv(csv)).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' },
    ]);
  });

  it('returns empty for header-only CSV', () => {
    expect(parseCsv('a,b')).toEqual([]);
  });
});
