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

  describe('geoshape', () => {
    it('creates legend groupby and multi-level region/state groupby', () => {
      const geoData = [
        { id: 1, rate: 0.05, region: 'South', state_name: 'Alabama' },
        { id: 2, rate: 0.10, region: 'West', state_name: 'California' },
        { id: 3, rate: 0.07, region: 'South', state_name: 'Georgia' },
      ];
      const spec: UnitOlliVisSpec = {
        data: geoData,
        mark: 'geoshape',
        fields: [
          { field: 'rate', type: 'quantitative' },
          { field: 'region', type: 'nominal' },
          { field: 'state_name', type: 'nominal' },
        ],
        legends: [{ field: 'rate', channel: 'color' }],
      };
      const result = inferStructure(spec);
      const nodes = Array.isArray(result) ? result : [result];
      expect(hasGroupby(nodes[0]!, 'rate')).toBe(true);
      const geoNode = nodes.find((n) => 'groupby' in n && Array.isArray(n.groupby));
      expect(geoNode).toBeDefined();
      expect('groupby' in geoNode! && geoNode!.groupby).toEqual(['region', 'state_name']);
    });

    it('creates only legend branch when no geographic fields', () => {
      const spec: UnitOlliVisSpec = {
        data: sampleData,
        mark: 'geoshape',
        fields: [{ field: 'rate', type: 'quantitative' }],
        legends: [{ field: 'rate', channel: 'color' }],
      };
      const result = inferStructure(spec);
      const nodes = Array.isArray(result) ? result : [result];
      expect(nodes.length).toBe(1);
      expect(hasGroupby(nodes[0]!, 'rate')).toBe(true);
    });

    it('creates state-only geographic branch when no region field', () => {
      const spec: UnitOlliVisSpec = {
        data: sampleData,
        mark: 'geoshape',
        fields: [
          { field: 'rate', type: 'quantitative' },
          { field: 'state_name', type: 'nominal' },
        ],
        legends: [{ field: 'rate', channel: 'color' }],
      };
      const result = inferStructure(spec);
      const nodes = Array.isArray(result) ? result : [result];
      expect(nodes.length).toBe(2);
      expect(hasGroupby(nodes[1]!, 'state_name')).toBe(true);
    });

    it('falls through to generic when no legends or geo fields', () => {
      const spec: UnitOlliVisSpec = {
        data: sampleData,
        mark: 'geoshape',
        fields: [{ field: 'value', type: 'quantitative' }],
      };
      const result = inferStructure(spec);
      const nodes = Array.isArray(result) ? result : [result];
      expect(nodes.length).toBe(1);
      expect(hasGroupby(nodes[0]!, 'value')).toBe(true);
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
