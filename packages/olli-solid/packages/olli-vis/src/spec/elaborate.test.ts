import { describe, it, expect } from 'vitest';
import { elaborateSpec } from './elaborate.js';
import type { UnitOlliVisSpec } from './types.js';

describe('elaborateSpec', () => {
  it('infers fields from data keys when not provided', () => {
    const spec: UnitOlliVisSpec = {
      data: [{ a: 1, b: 'x' }, { a: 2, b: 'y' }],
      mark: 'bar',
      axes: [
        { field: 'a', axisType: 'x' },
        { field: 'b', axisType: 'y' },
      ],
    };
    const result = elaborateSpec(spec) as UnitOlliVisSpec;
    expect(result.fields).toBeDefined();
    expect(result.fields!.length).toBe(2);
    expect(result.fields!.map((f) => f.field).sort()).toEqual(['a', 'b']);
  });

  it('infers field types', () => {
    const spec: UnitOlliVisSpec = {
      data: [
        { num: 1, cat: 'x' },
        { num: 2, cat: 'y' },
        { num: 3, cat: 'z' },
      ],
      mark: 'bar',
      axes: [
        { field: 'cat', axisType: 'x' },
        { field: 'num', axisType: 'y' },
      ],
    };
    const result = elaborateSpec(spec) as UnitOlliVisSpec;
    const numField = result.fields!.find((f) => f.field === 'num')!;
    const catField = result.fields!.find((f) => f.field === 'cat')!;
    expect(numField.type).toBe('quantitative');
    expect(catField.type).toBe('nominal');
  });

  it('infers structure when not provided', () => {
    const spec: UnitOlliVisSpec = {
      data: [
        { x: 'A', y: 10 },
        { x: 'B', y: 20 },
      ],
      mark: 'bar',
      axes: [
        { field: 'x', axisType: 'x' },
        { field: 'y', axisType: 'y' },
      ],
    };
    const result = elaborateSpec(spec) as UnitOlliVisSpec;
    expect(result.structure).toBeDefined();
  });

  it('preserves existing fields and structure', () => {
    const spec: UnitOlliVisSpec = {
      data: [{ a: 1 }],
      mark: 'point',
      fields: [{ field: 'a', type: 'quantitative' }],
      structure: [{ groupby: 'a' }],
    };
    const result = elaborateSpec(spec) as UnitOlliVisSpec;
    expect(result.fields).toEqual(spec.fields);
    expect(result.structure).toEqual(spec.structure);
  });
});
