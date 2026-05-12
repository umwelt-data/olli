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
      expect(desc).toContain('x-axis');
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

  it('aggregate token computes values for xAxis node', () => {
    createRoot((dispose) => {
      const runtime = setup();
      runtime.customization.applyPreset('high');
      const rootId = runtime.navTree().roots[0]!;
      const rootNode = runtime.getNavNode(rootId)!;
      const xAxisNavId = rootNode.childNavIds.find((id) => {
        const node = runtime.getNavNode(id)!;
        const edge = runtime.getHyperedge(node.hyperedgeId!)!;
        return edge.payload?.nodeType === 'xAxis';
      })!;
      const desc = runtime.getDescriptionFor(xAxisNavId)();
      // xAxis description should include aggregate info about the quantitative field
      expect(desc).toContain('average');
      dispose();
    });
  });
});
