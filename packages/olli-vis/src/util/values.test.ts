import { describe, it, expect } from 'vitest';
import { pluralize, averageValue, ordinalSuffix, dataPrecision } from './values.js';

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

  it('preserves decimals for fractional data', () => {
    const data = [{ x: 0.1 }, { x: 0.2 }, { x: 0.3 }];
    expect(averageValue(data, 'x')).toBeCloseTo(0.2);
  });
});

describe('dataPrecision', () => {
  it('returns 0 for integer data', () => {
    const data = [{ x: 10 }, { x: 20 }, { x: 30 }];
    expect(dataPrecision(data, 'x')).toBe(0);
  });

  it('returns 1 for one-decimal data', () => {
    const data = [{ x: 0.1 }, { x: 0.6 }, { x: 0.9 }];
    expect(dataPrecision(data, 'x')).toBe(1);
  });

  it('returns max precision across mixed data', () => {
    const data = [{ x: 1 }, { x: 1.5 }, { x: 1.25 }];
    expect(dataPrecision(data, 'x')).toBe(2);
  });

  it('caps high-precision normal-magnitude data at 2', () => {
    const data = [{ x: 1.23456 }, { x: 2.34567 }];
    expect(dataPrecision(data, 'x')).toBe(2);
  });

  it('extends precision for tiny values to first significant digit', () => {
    const data = [{ x: 0.00002 }, { x: 0.00003 }];
    expect(dataPrecision(data, 'x')).toBe(5);
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
