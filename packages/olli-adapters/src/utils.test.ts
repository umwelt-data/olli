import { describe, it, expect } from 'vitest';
import { filterUniqueObjects, inferFormatFromUrl, parseCsv, parseTsv, parseDelimited } from './utils.js';

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

  it('returns tsv for .tsv files', () => {
    expect(inferFormatFromUrl('data/file.tsv')).toBe('tsv');
  });

  it('returns json for .json files', () => {
    expect(inferFormatFromUrl('data/file.json')).toBe('json');
  });

  it('returns json for unknown extensions', () => {
    expect(inferFormatFromUrl('data/file.txt')).toBe('json');
  });
});

describe('parseCsv', () => {
  it('parses basic CSV with dynamic typing', () => {
    const csv = 'a,b\n1,2\n3,4';
    expect(parseCsv(csv)).toEqual([
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ]);
  });

  it('returns empty for header-only CSV', () => {
    expect(parseCsv('a,b')).toEqual([]);
  });

  it('handles string values', () => {
    const csv = 'name,value\nfoo,10\nbar,20';
    expect(parseCsv(csv)).toEqual([
      { name: 'foo', value: 10 },
      { name: 'bar', value: 20 },
    ]);
  });
});

describe('parseTsv', () => {
  it('parses tab-separated values', () => {
    const tsv = 'id\trate\n1001\t0.073\n1003\t0.051';
    expect(parseTsv(tsv)).toEqual([
      { id: 1001, rate: 0.073 },
      { id: 1003, rate: 0.051 },
    ]);
  });
});

describe('parseDelimited', () => {
  it('detects csv format by default', () => {
    const csv = 'x,y\n1,2';
    expect(parseDelimited(csv)).toEqual([{ x: 1, y: 2 }]);
  });

  it('uses tsv format when specified', () => {
    const tsv = 'x\ty\n1\t2';
    expect(parseDelimited(tsv, 'tsv')).toEqual([{ x: 1, y: 2 }]);
  });
});
