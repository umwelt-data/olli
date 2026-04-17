import { describe, it, expect } from 'vitest';
import { filterUniqueObjects, findScenegraphNodes } from './utils.js';

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

describe('findScenegraphNodes', () => {
  it('finds nodes by role', () => {
    const scene = {
      items: [
        { role: 'axis', items: [] },
        { role: 'mark', items: [] },
        {
          items: [{ role: 'axis', items: [] }],
        },
      ],
    };
    const result = findScenegraphNodes(scene, 'axis');
    expect(result.length).toBe(2);
  });

  it('excludes cancelled roles', () => {
    const scene = {
      items: [
        { role: 'axis-grid', items: [] },
        { role: 'axis', items: [] },
      ],
    };
    const result = findScenegraphNodes(scene, 'axis');
    expect(result.length).toBe(1);
  });

  it('returns empty for no items', () => {
    expect(findScenegraphNodes({}, 'axis')).toEqual([]);
  });
});
