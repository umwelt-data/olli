import { describe, it, expect } from 'vitest';
import { lowerVisSpec } from './lower.js';
import type { UnitOlliVisSpec, OlliDataset } from '../spec/types.js';

function barChartSpec(data: OlliDataset): UnitOlliVisSpec {
  return {
    data,
    mark: 'bar',
    fields: [
      { field: 'category', type: 'nominal' },
      { field: 'value', type: 'quantitative' },
    ],
    axes: [
      { field: 'category', axisType: 'x', title: 'Category' },
      { field: 'value', axisType: 'y', title: 'Value' },
    ],
    structure: [
      { groupby: 'category' },
      { groupby: 'value' },
    ],
  };
}

const sampleData: OlliDataset = [
  { category: 'A', value: 10 },
  { category: 'B', value: 20 },
  { category: 'C', value: 30 },
];

describe('lowerVisSpec', () => {
  it('creates a hypergraph from a unit spec', () => {
    const graph = lowerVisSpec(barChartSpec(sampleData));
    expect(graph.roots.length).toBe(1);
    expect(graph.edges.size).toBeGreaterThan(0);
  });

  it('assigns xAxis role for x-axis groupby', () => {
    const graph = lowerVisSpec(barChartSpec(sampleData));
    const xAxisEdges = [...graph.edges.values()].filter((e) => e.role === 'xAxis');
    expect(xAxisEdges.length).toBe(1);
    expect(xAxisEdges[0]!.payload?.groupby).toBe('category');
  });

  it('assigns yAxis role for y-axis groupby', () => {
    const graph = lowerVisSpec(barChartSpec(sampleData));
    const yAxisEdges = [...graph.edges.values()].filter((e) => e.role === 'yAxis');
    expect(yAxisEdges.length).toBe(1);
    expect(yAxisEdges[0]!.payload?.groupby).toBe('value');
  });

  it('creates filteredData children for groupby nodes', () => {
    const graph = lowerVisSpec(barChartSpec(sampleData));
    const xAxis = [...graph.edges.values()].find((e) => e.role === 'xAxis')!;
    expect(xAxis.children.length).toBe(3); // A, B, C
    for (const childId of xAxis.children) {
      const child = graph.edges.get(childId)!;
      expect(child.role).toBe('filteredData');
      expect(child.payload?.predicate).toBeDefined();
    }
  });

  it('handles multi spec with layer operator', () => {
    const spec = {
      operator: 'layer' as const,
      units: [
        { data: sampleData, mark: 'bar' as const, title: 'View 1' },
        { data: sampleData, mark: 'line' as const, title: 'View 2' },
      ],
    };
    const graph = lowerVisSpec(spec);
    expect(graph.roots.length).toBe(1);
    const root = graph.edges.get(graph.roots[0]!)!;
    expect(root.role).toBe('root');
    const views = root.children.map((id) => graph.edges.get(id)!);
    expect(views.length).toBe(2);
    expect(views.every((v) => v.role === 'view')).toBe(true);
  });

  it('creates annotation edges', () => {
    const spec: UnitOlliVisSpec = {
      data: sampleData,
      mark: 'bar',
      fields: [
        { field: 'category', type: 'nominal' },
        { field: 'value', type: 'quantitative' },
      ],
      axes: [
        { field: 'category', axisType: 'x' },
        { field: 'value', axisType: 'y' },
      ],
      structure: [
        { groupby: 'category' },
        {
          annotations: [
            { predicate: { field: 'category', equal: 'A' }, name: 'Highlight A' },
          ],
        },
      ],
    };
    const graph = lowerVisSpec(spec);
    const annotationEdge = [...graph.edges.values()].find((e) => e.role === 'annotations');
    expect(annotationEdge).toBeDefined();
    expect(annotationEdge!.displayName).toBe('Data highlights');
  });

  it('carries VisPayload with spec reference on every edge', () => {
    const graph = lowerVisSpec(barChartSpec(sampleData));
    for (const [, edge] of graph.edges) {
      expect(edge.payload).toBeDefined();
      expect(edge.payload!.spec).toBeDefined();
      expect(edge.payload!.spec.data).toBeDefined();
    }
  });
});
