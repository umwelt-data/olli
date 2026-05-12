import { describe, it, expect } from 'vitest';
import { typeInference } from './types.js';

describe('typeInference', () => {
  it('infers quantitative for numeric data', () => {
    const data = [{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4.5 }];
    expect(typeInference(data, 'x')).toBe('quantitative');
  });

  it('infers nominal for string data', () => {
    const data = [{ x: 'a' }, { x: 'b' }, { x: 'c' }];
    expect(typeInference(data, 'x')).toBe('nominal');
  });

  it('infers temporal for date data', () => {
    const data = [
      { x: new Date('2020-01-01') },
      { x: new Date('2020-02-01') },
      { x: new Date('2020-03-01') },
    ];
    expect(typeInference(data, 'x')).toBe('temporal');
  });

  it('infers nominal for integer-like data with few distinct values and low proportion', () => {
    const data: Record<string, number>[] = [];
    for (let i = 0; i < 100; i++) {
      data.push({ x: i % 3 });
    }
    expect(typeInference(data, 'x')).toBe('nominal');
  });

  it('infers quantitative for numbers with many distinct values', () => {
    const data: Record<string, number>[] = [];
    for (let i = 0; i < 100; i++) {
      data.push({ x: i * 1.1 });
    }
    expect(typeInference(data, 'x')).toBe('quantitative');
  });
});
