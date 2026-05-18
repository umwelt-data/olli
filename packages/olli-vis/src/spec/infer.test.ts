import { describe, it, expect } from 'vitest';
import { inferStructure } from './infer.js';
import type { UnitOlliVisSpec, OlliNode } from './types.js';

function hasGroupby(node: OlliNode, field: string): boolean {
  return 'groupby' in node && node.groupby === field;
}

describe('inferStructure', () => {
  const sampleData = [
    { x: 'A', y: 10, color: 'red' },
    { x: 'B', y: 20, color: 'blue' },
  ];

  describe('faceted specs', () => {
    it('uses facet as parent with axes as children', () => {
      const spec: UnitOlliVisSpec = {
        data: sampleData,
        facet: 'color',
        axes: [
          { field: 'x', axisType: 'x' },
          { field: 'y', axisType: 'y' },
        ],
      };
      const result = inferStructure(spec);
      expect(Array.isArray(result)).toBe(false);
      const node = result as OlliNode;
      expect(hasGroupby(node, 'color')).toBe(true);
      expect('children' in node && node.children!.length).toBe(2);
    });

    it('uses non-facet fields as children when no axes', () => {
      const spec: UnitOlliVisSpec = {
        data: sampleData,
        facet: 'color',
        fields: [
          { field: 'color', type: 'nominal' },
          { field: 'x', type: 'nominal' },
          { field: 'y', type: 'quantitative' },
        ],
      };
      const result = inferStructure(spec);
      expect(Array.isArray(result)).toBe(false);
      const node = result as OlliNode;
      expect(hasGroupby(node, 'color')).toBe(true);
      const children = 'children' in node ? node.children! : [];
      expect(children.length).toBe(2);
      expect(children.every((c) => !hasGroupby(c, 'color'))).toBe(true);
    });
  });

  describe('line chart with color legend', () => {
    it('uses color legend as parent', () => {
      const spec: UnitOlliVisSpec = {
        data: sampleData,
        mark: 'line',
        axes: [{ field: 'x', axisType: 'x' }],
        legends: [{ field: 'color', channel: 'color' }],
      };
      const result = inferStructure(spec);
      expect(Array.isArray(result)).toBe(false);
      const node = result as OlliNode;
      expect(hasGroupby(node, 'color')).toBe(true);
    });

    it('puts remaining guides as children', () => {
      const spec: UnitOlliVisSpec = {
        data: sampleData,
        mark: 'line',
        axes: [
          { field: 'x', axisType: 'x' },
          { field: 'y', axisType: 'y' },
        ],
        legends: [{ field: 'color', channel: 'color' }],
      };
      const result = inferStructure(spec) as OlliNode;
      const children = 'children' in result ? result.children! : [];
      expect(children.length).toBe(2);
    });
  });

  describe('bar chart', () => {
    it('filters out quantitative axis', () => {
      const spec: UnitOlliVisSpec = {
        data: sampleData,
        mark: 'bar',
        fields: [
          { field: 'x', type: 'nominal' },
          { field: 'y', type: 'quantitative' },
        ],
        axes: [
          { field: 'x', axisType: 'x' },
          { field: 'y', axisType: 'y' },
        ],
      };
      const result = inferStructure(spec);
      const nodes = Array.isArray(result) ? result : [result];
      expect(nodes.length).toBe(1);
      expect(hasGroupby(nodes[0]!, 'x')).toBe(true);
    });

    it('uses non-quantitative fields when no axes', () => {
      const spec: UnitOlliVisSpec = {
        data: sampleData,
        mark: 'bar',
        fields: [
          { field: 'x', type: 'nominal' },
          { field: 'y', type: 'quantitative' },
        ],
      };
      const result = inferStructure(spec);
      const nodes = Array.isArray(result) ? result : [result];
      expect(nodes.length).toBe(1);
      expect(hasGroupby(nodes[0]!, 'x')).toBe(true);
    });
  });

  describe('generic specs', () => {
    it('creates nodes from axes and legends', () => {
      const spec: UnitOlliVisSpec = {
        data: sampleData,
        mark: 'point',
        axes: [{ field: 'x', axisType: 'x' }],
        legends: [{ field: 'color', channel: 'color' }],
      };
      const result = inferStructure(spec);
      const nodes = Array.isArray(result) ? result : [result];
      expect(nodes.length).toBe(2);
    });

    it('falls back to fields when no guides', () => {
      const spec: UnitOlliVisSpec = {
        data: sampleData,
        fields: [
          { field: 'x', type: 'nominal' },
          { field: 'y', type: 'quantitative' },
        ],
      };
      const result = inferStructure(spec);
      const nodes = Array.isArray(result) ? result : [result];
      expect(nodes.length).toBe(2);
    });
  });

  describe('deduplication', () => {
    it('removes duplicate groupby fields from guides', () => {
      const spec: UnitOlliVisSpec = {
        data: sampleData,
        mark: 'point',
        axes: [{ field: 'x', axisType: 'x' }],
        guides: [{ field: 'x' }],
      };
      const result = inferStructure(spec);
      const nodes = Array.isArray(result) ? result : [result];
      expect(nodes.length).toBe(1);
    });
  });
});
