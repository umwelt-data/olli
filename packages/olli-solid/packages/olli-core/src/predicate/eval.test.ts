import { describe, expect, it } from 'vitest';
import { selectionTest, testDatum } from './eval.js';

const data = [
  { year: 2020, region: 'east', value: 10 },
  { year: 2021, region: 'east', value: 20 },
  { year: 2022, region: 'west', value: 30 },
  { year: 2023, region: 'west', value: 40 },
];

describe('testDatum', () => {
  it('equal', () => {
    expect(testDatum({ x: 5 }, { field: 'x', equal: 5 })).toBe(true);
    expect(testDatum({ x: 5 }, { field: 'x', equal: 6 })).toBe(false);
  });

  it('lt/gt/lte/gte', () => {
    expect(testDatum({ x: 5 }, { field: 'x', lt: 6 })).toBe(true);
    expect(testDatum({ x: 5 }, { field: 'x', lt: 5 })).toBe(false);
    expect(testDatum({ x: 5 }, { field: 'x', gt: 4 })).toBe(true);
    expect(testDatum({ x: 5 }, { field: 'x', lte: 5 })).toBe(true);
    expect(testDatum({ x: 5 }, { field: 'x', gte: 5 })).toBe(true);
  });

  it('range inclusive by default', () => {
    expect(testDatum({ x: 5 }, { field: 'x', range: [1, 5] })).toBe(true);
    expect(
      testDatum({ x: 5 }, { field: 'x', range: [1, 5], inclusive: false }),
    ).toBe(false);
  });

  it('oneOf', () => {
    expect(testDatum({ r: 'a' }, { field: 'r', oneOf: ['a', 'b'] })).toBe(true);
    expect(testDatum({ r: 'c' }, { field: 'r', oneOf: ['a', 'b'] })).toBe(false);
  });

  it('valid', () => {
    expect(testDatum({ x: 1 }, { field: 'x', valid: true })).toBe(true);
    expect(testDatum({ x: null }, { field: 'x', valid: true })).toBe(false);
    expect(testDatum({ x: Number.NaN }, { field: 'x', valid: true })).toBe(false);
  });

  it('and/or/not compose', () => {
    const datum = { year: 2021, region: 'east' };
    expect(
      testDatum(datum, {
        and: [
          { field: 'year', gte: 2020 },
          { field: 'region', equal: 'east' },
        ],
      }),
    ).toBe(true);
    expect(
      testDatum(datum, {
        or: [
          { field: 'year', equal: 1999 },
          { field: 'region', equal: 'east' },
        ],
      }),
    ).toBe(true);
    expect(testDatum(datum, { not: { field: 'region', equal: 'east' } })).toBe(false);
  });

  it('empty and returns all data through selectionTest', () => {
    expect(selectionTest(data, { and: [] }).length).toBe(data.length);
  });

  it('selectionTest filters correctly', () => {
    const out = selectionTest(data, {
      and: [
        { field: 'region', equal: 'west' },
        { field: 'value', gte: 35 },
      ],
    });
    expect(out).toEqual([{ year: 2023, region: 'west', value: 40 }]);
  });

  it('dates numericize for comparison', () => {
    const a = new Date('2024-01-01');
    const b = new Date('2024-06-01');
    expect(testDatum({ d: a }, { field: 'd', lt: b })).toBe(true);
    expect(testDatum({ d: b }, { field: 'd', equal: b })).toBe(true);
  });
});
