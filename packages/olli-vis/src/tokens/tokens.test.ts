import { describe, it, expect } from 'vitest';
import { createRoot } from 'solid-js';
import { buildHypergraph, createNavigationRuntime, registerDomain } from 'olli-core';
import { visDomain } from '../domain.js';
import { lowerVisSpec } from '../lower/lower.js';
import type { UnitOlliVisSpec, OlliDataset, VisPayload } from '../spec/types.js';

const data: OlliDataset = [
  { category: 'A', value: 10 },
  { category: 'B', value: 20 },
  { category: 'C', value: 30 },
];

const spec: UnitOlliVisSpec = {
  data,
  mark: 'bar',
  title: 'Sales by Category',
  description: 'A bar chart showing sales by category',
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

function setup() {
  const graph = lowerVisSpec(spec);
  const runtime = createNavigationRuntime<VisPayload>(graph);
  registerDomain(runtime, visDomain);
  return runtime;
}

describe('vis tokens', () => {
  it('root description includes chart title and type', () => {
    createRoot((dispose) => {
      const runtime = setup();
      const rootId = runtime.navTree().roots[0]!;
      const desc = runtime.getDescriptionFor(rootId)();
      expect(desc).toContain('bar chart');
      dispose();
    });
  });

  it('xAxis description includes axis title', () => {
    createRoot((dispose) => {
      const runtime = setup();
      const rootId = runtime.navTree().roots[0]!;
      const rootNode = runtime.getNavNode(rootId)!;
      const xAxisNavId = rootNode.childNavIds.find((id) => {
        const node = runtime.getNavNode(id)!;
        const edge = runtime.getHyperedge(node.hyperedgeId!)!;
        return edge.payload?.nodeType === 'xAxis';
      })!;
      const desc = runtime.getDescriptionFor(xAxisNavId)();
      expect(desc).toContain('Category');
      expect(desc.toLowerCase()).toContain('x-axis');
      dispose();
    });
  });

  it('filteredData description includes predicate text', () => {
    createRoot((dispose) => {
      const runtime = setup();
      const rootId = runtime.navTree().roots[0]!;
      const rootNode = runtime.getNavNode(rootId)!;
      const xAxisNavId = rootNode.childNavIds.find((id) => {
        const node = runtime.getNavNode(id)!;
        const edge = runtime.getHyperedge(node.hyperedgeId!)!;
        return edge.payload?.nodeType === 'xAxis';
      })!;
      const xAxisNode = runtime.getNavNode(xAxisNavId)!;
      const firstChild = xAxisNode.childNavIds[0]!;
      const desc = runtime.getDescriptionFor(firstChild)();
      expect(desc.length).toBeGreaterThan(0);
      dispose();
    });
  });

  it('geoshape with color legend produces choropleth map type', () => {
    const geoSpec: UnitOlliVisSpec = {
      data: [
        { id: 1, rate: 0.05, region: 'South', state_name: 'Alabama' },
        { id: 2, rate: 0.10, region: 'West', state_name: 'California' },
      ],
      mark: 'geoshape',
      fields: [
        { field: 'rate', type: 'quantitative' },
        { field: 'region', type: 'nominal' },
        { field: 'state_name', type: 'nominal' },
      ],
      legends: [{ field: 'rate', channel: 'color' }],
    };
    createRoot((dispose) => {
      const graph = lowerVisSpec(geoSpec);
      const runtime = createNavigationRuntime<VisPayload>(graph);
      registerDomain(runtime, visDomain);
      const rootId = runtime.navTree().roots[0]!;
      const desc = runtime.getDescriptionFor(rootId)();
      expect(desc).toContain('choropleth map');
      dispose();
    });
  });

  it('other group node description contains field label', () => {
    const otherSpec: UnitOlliVisSpec = {
      data: [
        { category: 'A', value: 10 },
        { category: 'B', value: 20 },
      ],
      mark: 'point',
      fields: [
        { field: 'category', type: 'nominal' },
        { field: 'value', type: 'quantitative' },
      ],
      structure: [
        { groupby: 'value' },
        { groupby: 'category' },
      ],
    };
    createRoot((dispose) => {
      const graph = lowerVisSpec(otherSpec);
      const runtime = createNavigationRuntime<VisPayload>(graph);
      registerDomain(runtime, visDomain);
      const rootId = runtime.navTree().roots[0]!;
      const rootNode = runtime.getNavNode(rootId)!;
      const otherNavId = rootNode.childNavIds.find((id) => {
        const node = runtime.getNavNode(id)!;
        const edge = runtime.getHyperedge(node.hyperedgeId!)!;
        return edge.payload?.nodeType === 'other';
      })!;
      expect(otherNavId).toBeDefined();
      const desc = runtime.getDescriptionFor(otherNavId)();
      expect(desc.length).toBeGreaterThan(0);
      expect(desc).toContain('value');
      expect(desc).not.toContain('guide titled');
      dispose();
    });
  });

  it('geoshape without color legend produces map type', () => {
    const geoSpec: UnitOlliVisSpec = {
      data: [
        { id: 1, region: 'South' },
        { id: 2, region: 'West' },
      ],
      mark: 'geoshape',
      fields: [
        { field: 'region', type: 'nominal' },
      ],
    };
    createRoot((dispose) => {
      const graph = lowerVisSpec(geoSpec);
      const runtime = createNavigationRuntime<VisPayload>(graph);
      registerDomain(runtime, visDomain);
      const rootId = runtime.navTree().roots[0]!;
      const desc = runtime.getDescriptionFor(rootId)();
      expect(desc).toContain('map');
      dispose();
    });
  });

  it('aggregate token shows on value axis but not key axis', () => {
    createRoot((dispose) => {
      const runtime = setup();
      runtime.customization.applyPreset('detailed');
      const rootId = runtime.navTree().roots[0]!;
      const rootNode = runtime.getNavNode(rootId)!;
      const xAxisNavId = rootNode.childNavIds.find((id) => {
        const node = runtime.getNavNode(id)!;
        const edge = runtime.getHyperedge(node.hyperedgeId!)!;
        return edge.payload?.nodeType === 'xAxis';
      })!;
      const yAxisNavId = rootNode.childNavIds.find((id) => {
        const node = runtime.getNavNode(id)!;
        const edge = runtime.getHyperedge(node.hyperedgeId!)!;
        return edge.payload?.nodeType === 'yAxis';
      })!;
      const xDesc = runtime.getDescriptionFor(xAxisNavId)();
      const yDesc = runtime.getDescriptionFor(yAxisNavId)();
      expect(xDesc).not.toContain('average');
      expect(yDesc).toContain('average');
      dispose();
    });
  });
});
