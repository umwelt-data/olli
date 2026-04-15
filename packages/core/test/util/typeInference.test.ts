import { describe, expect, it } from 'vitest';
import { typeInference } from '../../src/util/types';
import type { OlliDataset } from '../../src/Types';

const buildDataset = (field: string, values: unknown[]): OlliDataset =>
  values.map((v) => ({ [field]: v as any }));

describe('typeInference', () => {
  it('labels float columns as quantitative', () => {
    const data = buildDataset('x', [1.1, 2.2, 3.3, 4.4, 5.5]);
    expect(typeInference(data, 'x')).toBe('quantitative');
  });

  it('labels string columns as nominal', () => {
    const data = buildDataset('cat', ['a', 'b', 'c', 'a', 'b']);
    expect(typeInference(data, 'cat')).toBe('nominal');
  });

  it('labels boolean columns as nominal', () => {
    const data = buildDataset('flag', [true, false, true, false]);
    expect(typeInference(data, 'flag')).toBe('nominal');
  });

  it('labels ISO date strings as temporal', () => {
    const data = buildDataset('day', ['2024-01-01', '2024-02-01', '2024-03-01', '2024-04-01']);
    expect(typeInference(data, 'day')).toBe('temporal');
  });

  it('treats low-cardinality integer columns as nominal', () => {
    // 3 distinct values across 100 rows ⇒ distinct < 40 and ratio 0.03 < 0.05 ⇒ nominal.
    const values: number[] = [];
    for (let i = 0; i < 100; i += 1) values.push(i % 3);
    expect(typeInference(buildDataset('cluster', values), 'cluster')).toBe('nominal');
  });

  it('treats high-cardinality integer columns as quantitative', () => {
    // 50 distinct values ⇒ distinct >= 40 ⇒ falls through to quantitative.
    const values: number[] = [];
    for (let i = 0; i < 100; i += 1) values.push(i % 50);
    expect(typeInference(buildDataset('bin', values), 'bin')).toBe('quantitative');
  });

  it('treats integer columns with high distinct ratio as quantitative', () => {
    // 30 distinct values across 100 rows ⇒ ratio 0.30 >= 0.05 ⇒ quantitative.
    const values: number[] = [];
    for (let i = 0; i < 100; i += 1) values.push(i % 30);
    expect(typeInference(buildDataset('score', values), 'score')).toBe('quantitative');
  });

  it('ignores null/undefined entries when inferring', () => {
    const data = buildDataset('x', [1.1, null, 2.2, undefined, 3.3]);
    expect(typeInference(data, 'x')).toBe('quantitative');
  });
});
