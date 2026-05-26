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

  it('other group nodes use field label as displayName', () => {
    const spec: UnitOlliVisSpec = {
      data: [
        { region: 'South', rate: 0.05 },
        { region: 'West', rate: 0.10 },
      ],
      mark: 'geoshape',
      fields: [
        { field: 'region', type: 'nominal' },
        { field: 'rate', type: 'quantitative' },
      ],
      legends: [{ field: 'rate', channel: 'color' }],
      structure: [
        { groupby: 'rate', children: [] },
        { groupby: 'region' },
      ],
    };
    const graph = lowerVisSpec(spec);
    const otherEdge = [...graph.edges.values()].find((e) => e.role === 'other');
    expect(otherEdge).toBeDefined();
    expect(otherEdge!.displayName).toBe('region');
  });

  it('nested groupby children see full dataset (shared scale)', () => {
    const data: OlliDataset = [
      { color: 'red', x: 'A', y: 10 },
      { color: 'red', x: 'B', y: 20 },
      { color: 'blue', x: 'C', y: 30 },
    ];
    const spec: UnitOlliVisSpec = {
      data,
      mark: 'point',
      fields: [
        { field: 'color', type: 'nominal' },
        { field: 'x', type: 'nominal' },
        { field: 'y', type: 'quantitative' },
      ],
      axes: [
        { field: 'x', axisType: 'x' },
        { field: 'y', axisType: 'y' },
      ],
      structure: [
        {
          groupby: 'color',
          children: [{ groupby: 'x' }],
        },
      ],
    };
    const graph = lowerVisSpec(spec);
    const colorEdge = [...graph.edges.values()].find(
      (e) => e.payload?.groupby === 'color',
    )!;
    const redEdge = colorEdge.children
      .map((id) => graph.edges.get(id)!)
      .find((e) => e.displayName === 'red')!;
    const xGroupUnderRed = redEdge.children
      .map((id) => graph.edges.get(id)!)
      .find((e) => e.payload?.groupby === 'x')!;
    const xValues = xGroupUnderRed.children
      .map((id) => graph.edges.get(id)!)
      .map((e) => e.displayName);
    expect(xValues).toContain('A');
    expect(xValues).toContain('B');
    expect(xValues).toContain('C');
  });

  it('faceted spec y-axis covers full data range', () => {
    const data: OlliDataset = [
      { series: 'A', x: 1, y: 10 },
      { series: 'A', x: 2, y: 20 },
      { series: 'B', x: 1, y: 100 },
      { series: 'B', x: 2, y: 200 },
    ];
    const spec: UnitOlliVisSpec = {
      data,
      mark: 'line',
      facet: 'series',
      fields: [
        { field: 'series', type: 'nominal' },
        { field: 'x', type: 'quantitative' },
        { field: 'y', type: 'quantitative' },
      ],
      axes: [
        { field: 'x', axisType: 'x' },
        { field: 'y', axisType: 'y' },
      ],
      structure: {
        groupby: 'series',
        children: [
          { groupby: 'x' },
          { groupby: 'y' },
        ],
      },
    };
    const graph = lowerVisSpec(spec);
    const facetA = [...graph.edges.values()].find(
      (e) => e.displayName === 'A' && e.role === 'view',
    )!;
    const yAxisUnderA = facetA.children
      .map((id) => graph.edges.get(id)!)
      .find((e) => e.payload?.groupby === 'y')!;
    const yChildren = yAxisUnderA.children.map((id) => graph.edges.get(id)!);
    const allYValues = yChildren.flatMap((e) => {
      if (e.payload?.predicate && 'range' in e.payload.predicate) {
        return e.payload.predicate.range as number[];
      }
      if (e.payload?.predicate && 'equal' in e.payload.predicate) {
        return [e.payload.predicate.equal as number];
      }
      return [];
    });
    expect(Math.max(...allYValues)).toBeGreaterThanOrEqual(200);
    expect(Math.min(...allYValues)).toBeLessThanOrEqual(10);
  });

  it('layered spec axes cover full data range', () => {
    const spec = {
      operator: 'layer' as const,
      units: [
        {
          data: [
            { x: 1, y: 10 },
            { x: 2, y: 20 },
          ],
          mark: 'line' as const,
          title: 'Line',
          fields: [
            { field: 'x', type: 'quantitative' as const },
            { field: 'y', type: 'quantitative' as const },
          ],
          axes: [
            { field: 'x', axisType: 'x' as const },
            { field: 'y', axisType: 'y' as const },
          ],
          structure: [
            { groupby: 'x' },
            { groupby: 'y' },
          ],
        },
        {
          data: [
            { x: 1, y: 100 },
            { x: 2, y: 200 },
          ],
          mark: 'bar' as const,
          title: 'Bar',
          fields: [
            { field: 'x', type: 'quantitative' as const },
            { field: 'y', type: 'quantitative' as const },
          ],
          axes: [
            { field: 'x', axisType: 'x' as const },
            { field: 'y', axisType: 'y' as const },
          ],
          structure: [
            { groupby: 'x' },
            { groupby: 'y' },
          ],
        },
      ],
    };
    const graph = lowerVisSpec(spec);
    const lineView = [...graph.edges.values()].find(
      (e) => e.role === 'view' && e.displayName === 'Line',
    )!;
    const yAxisInLine = lineView.children
      .map((id) => graph.edges.get(id)!)
      .find((e) => e.payload?.groupby === 'y')!;
    expect(yAxisInLine).toBeDefined();
    expect(yAxisInLine.children.length).toBeGreaterThan(0);
  });

  it('multi-level groupby scopes children to parent (hierarchical containment)', () => {
    const data: OlliDataset = [
      { region: 'South', state_name: 'Alabama', rate: 0.05 },
      { region: 'South', state_name: 'Georgia', rate: 0.07 },
      { region: 'West', state_name: 'California', rate: 0.10 },
    ];
    const spec: UnitOlliVisSpec = {
      data,
      mark: 'geoshape',
      fields: [
        { field: 'region', type: 'nominal' },
        { field: 'state_name', type: 'nominal' },
        { field: 'rate', type: 'quantitative' },
      ],
      legends: [{ field: 'rate', channel: 'color' }],
      guides: [{ field: 'region', title: 'Geography' }],
      structure: [
        { groupby: 'rate', children: [] },
        { groupby: ['region', 'state_name'] },
      ],
    };
    const graph = lowerVisSpec(spec);
    const guideEdge = [...graph.edges.values()].find((e) => e.role === 'guide');
    expect(guideEdge).toBeDefined();
    expect(guideEdge!.displayName).toBe('guide titled Geography');

    const southEdge = guideEdge!.children
      .map((id) => graph.edges.get(id)!)
      .find((e) => e.displayName === 'South')!;
    expect(southEdge).toBeDefined();
    const southStates = southEdge.children
      .map((id) => graph.edges.get(id)!)
      .map((e) => e.displayName);
    expect(southStates).toContain('Alabama');
    expect(southStates).toContain('Georgia');
    expect(southStates).not.toContain('California');

    const westEdge = guideEdge!.children
      .map((id) => graph.edges.get(id)!)
      .find((e) => e.displayName === 'West')!;
    expect(westEdge).toBeDefined();
    const westStates = westEdge.children
      .map((id) => graph.edges.get(id)!)
      .map((e) => e.displayName);
    expect(westStates).toContain('California');
    expect(westStates).not.toContain('Alabama');
    expect(westStates).not.toContain('Georgia');
  });
});
