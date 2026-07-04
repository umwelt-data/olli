import { describe, it, expect } from 'vitest';
import { getFieldDef, getDomain, getBinPredicates, fieldToPredicates } from './data.js';
import type { OlliFieldDef, OlliDataset } from '../spec/types.js';

describe('getFieldDef', () => {
  const fields: OlliFieldDef[] = [
    { field: 'x', type: 'quantitative' },
    { field: 'y', type: 'nominal' },
  ];

  it('returns matching field def', () => {
    expect(getFieldDef('x', fields)).toEqual({ field: 'x', type: 'quantitative' });
  });

  it('returns fallback when field not found', () => {
    expect(getFieldDef('z', fields)).toEqual({ field: 'z' });
  });
});

describe('getDomain', () => {
  it('returns sorted unique nominal values', () => {
    const data: OlliDataset = [{ c: 'banana' }, { c: 'apple' }, { c: 'cherry' }, { c: 'apple' }];
    const result = getDomain({ field: 'c', type: 'nominal' }, data);
    expect(result).toEqual(['apple', 'banana', 'cherry']);
  });

  it('returns sorted unique quantitative values', () => {
    const data: OlliDataset = [{ v: 30 }, { v: 10 }, { v: 20 }, { v: 10 }];
    const result = getDomain({ field: 'v', type: 'quantitative' }, data);
    expect(result).toEqual([10, 20, 30]);
  });

  it('skips null and undefined values', () => {
    const data = [{ v: 1 }, { v: null as any }, { v: 3 }];
    const result = getDomain({ field: 'v', type: 'quantitative' }, data);
    expect(result).toEqual([1, 3]);
  });

  it('returns empty array for empty dataset', () => {
    expect(getDomain({ field: 'v' }, [])).toEqual([]);
  });

  it('deduplicates dates by getTime()', () => {
    const d1 = new Date('2020-01-01');
    const d2 = new Date('2020-01-01');
    const d3 = new Date('2020-06-01');
    const data: OlliDataset = [{ t: d1 }, { t: d2 }, { t: d3 }];
    const result = getDomain({ field: 't', type: 'temporal' }, data);
    expect(result).toHaveLength(2);
    expect((result[0] as Date).getTime()).toBe(d1.getTime());
    expect((result[1] as Date).getTime()).toBe(d3.getTime());
  });

  it('sorts dates chronologically', () => {
    const jan = new Date('2020-01-01');
    const mar = new Date('2020-03-01');
    const feb = new Date('2020-02-01');
    const data: OlliDataset = [{ t: mar }, { t: jan }, { t: feb }];
    const result = getDomain({ field: 't', type: 'temporal' }, data);
    expect((result[0] as Date).getTime()).toBe(jan.getTime());
    expect((result[1] as Date).getTime()).toBe(feb.getTime());
    expect((result[2] as Date).getTime()).toBe(mar.getTime());
  });

  it('deduplicates dates by timeUnit when provided', () => {
    const d1 = new Date('2020-01-15');
    const d2 = new Date('2020-01-20');
    const d3 = new Date('2020-02-10');
    const data: OlliDataset = [{ t: d1 }, { t: d2 }, { t: d3 }];
    const result = getDomain({ field: 't', type: 'temporal', timeUnit: 'month' }, data);
    expect(result).toHaveLength(2);
  });

  it('filters data by predicate when provided', () => {
    const data: OlliDataset = [
      { c: 'A', v: 10 },
      { c: 'B', v: 20 },
      { c: 'A', v: 30 },
    ];
    const result = getDomain({ field: 'v', type: 'quantitative' }, data, { field: 'c', equal: 'A' });
    expect(result).toEqual([10, 30]);
  });
});

describe('getBinPredicates', () => {
  const fields: OlliFieldDef[] = [{ field: 'v', type: 'quantitative' }];
  const data: OlliDataset = [{ v: 0 }, { v: 50 }, { v: 100 }];

  it('produces range predicates with correct field', () => {
    const preds = getBinPredicates('v', data, fields, [0, 50, 100]);
    expect(preds.length).toBe(2);
    for (const p of preds) {
      expect(p.field).toBe('v');
      expect(p.range).toBeDefined();
      expect(p.inclusiveLeft).toBe(true);
    }
  });

  it('sets inclusiveRight only on last bin', () => {
    const preds = getBinPredicates('v', data, fields, [0, 50, 100]);
    expect(preds[0]!.inclusiveRight).toBe(false);
    expect(preds[preds.length - 1]!.inclusiveRight).toBe(true);
  });
});

describe('fieldToPredicates', () => {
  it('produces equal predicates for nominal fields', () => {
    const fields: OlliFieldDef[] = [{ field: 'c', type: 'nominal' }];
    const data: OlliDataset = [{ c: 'A' }, { c: 'B' }, { c: 'C' }];
    const preds = fieldToPredicates('c', data, fields);
    expect(preds).toEqual([
      { field: 'c', equal: 'A' },
      { field: 'c', equal: 'B' },
      { field: 'c', equal: 'C' },
    ]);
  });

  it('produces equal predicates for ordinal fields', () => {
    const fields: OlliFieldDef[] = [{ field: 'grade', type: 'ordinal' }];
    const data: OlliDataset = [{ grade: 'A' }, { grade: 'B' }];
    const preds = fieldToPredicates('grade', data, fields);
    expect(preds).toHaveLength(2);
    expect(preds[0]).toHaveProperty('equal');
  });

  it('produces range predicates for quantitative fields', () => {
    const fields: OlliFieldDef[] = [{ field: 'v', type: 'quantitative' }];
    const data: OlliDataset = [{ v: 0 }, { v: 50 }, { v: 100 }];
    const preds = fieldToPredicates('v', data, fields);
    expect(preds.length).toBeGreaterThan(0);
    expect(preds[0]).toHaveProperty('range');
  });
});
