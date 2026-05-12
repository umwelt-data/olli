import { describe, it, expect } from 'vitest';
import { fmtValue, pluralize, averageValue, ordinalSuffix } from './values.js';

describe('fmtValue', () => {
  it('formats numbers', () => {
    expect(fmtValue(42, { field: 'x', type: 'quantitative' })).toBe('42');
  });

  it('formats strings', () => {
    expect(fmtValue('hello', { field: 'x', type: 'nominal' })).toBe('hello');
  });

  it('formats dates', () => {
    const result = fmtValue(new Date('2020-06-15'), { field: 'x', type: 'temporal' });
    expect(result).toContain('2020');
  });
});

describe('pluralize', () => {
  it('uses singular for 1', () => {
    expect(pluralize(1, 'value')).toBe('1 value');
  });

  it('uses plural for > 1', () => {
    expect(pluralize(3, 'value')).toBe('3 values');
  });
});

describe('averageValue', () => {
  it('computes average', () => {
    const data = [{ x: 10 }, { x: 20 }, { x: 30 }];
    expect(averageValue(data, 'x')).toBe(20);
  });
});

describe('ordinalSuffix', () => {
  it('handles 1st, 2nd, 3rd, 4th', () => {
    expect(ordinalSuffix(1)).toBe('1st');
    expect(ordinalSuffix(2)).toBe('2nd');
    expect(ordinalSuffix(3)).toBe('3rd');
    expect(ordinalSuffix(4)).toBe('4th');
  });
});
