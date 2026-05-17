import { describe, it, expect } from 'vitest';
import { fmtValue, pluralize, averageValue, ordinalSuffix, dataPrecision, minPrecisionForValue } from './values.js';

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

describe('fmtValue with precision', () => {
  it('uses provided precision for numbers', () => {
    expect(fmtValue(0.53, { field: 'x', type: 'quantitative' }, 1)).toBe('0.5');
  });

  it('applies precision even to integer values', () => {
    expect(fmtValue(20, { field: 'x', type: 'quantitative' }, 1)).toBe('20.0');
  });

  it('falls back to toFixed(2) without precision', () => {
    expect(fmtValue(3.14159, { field: 'x', type: 'quantitative' })).toBe('3.14');
  });
});

describe('minPrecisionForValue', () => {
  it('returns 0 for zero', () => {
    expect(minPrecisionForValue(0)).toBe(0);
  });

  it('returns 0 for values >= 1', () => {
    expect(minPrecisionForValue(1)).toBe(0);
    expect(minPrecisionForValue(42)).toBe(0);
    expect(minPrecisionForValue(3.14)).toBe(0);
  });

  it('returns correct precision for small values', () => {
    expect(minPrecisionForValue(0.5)).toBe(1);
    expect(minPrecisionForValue(0.1)).toBe(1);
    expect(minPrecisionForValue(0.01)).toBe(2);
    expect(minPrecisionForValue(0.001)).toBe(3);
    expect(minPrecisionForValue(0.00002)).toBe(5);
  });

  it('handles negative values', () => {
    expect(minPrecisionForValue(-0.00002)).toBe(5);
    expect(minPrecisionForValue(-5)).toBe(0);
  });
});

describe('fmtValue default precision for tiny values', () => {
  it('extends precision for tiny decimals', () => {
    expect(fmtValue(0.00002, { field: 'x', type: 'quantitative' })).toBe('0.00002');
  });

  it('still caps normal decimals at 2', () => {
    expect(fmtValue(1.23456, { field: 'x', type: 'quantitative' })).toBe('1.23');
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
