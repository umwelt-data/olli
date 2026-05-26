import { describe, it, expect } from 'vitest';
import { createRoot } from 'solid-js';
import { createNavigationRuntime, registerDomain } from 'olli-core';
import { visDomain } from './domain.js';
import { lowerVisSpec } from './lower/lower.js';
import type { UnitOlliVisSpec, OlliDataset, VisPayload } from './spec/types.js';

const data: OlliDataset = [
  { category: 'A', value: 10 },
  { category: 'B', value: 20 },
  { category: 'C', value: 30 },
];

const spec: UnitOlliVisSpec = {
  data,
  mark: 'bar',
  description: 'Test chart',
  fields: [
    { field: 'category', type: 'nominal' },
    { field: 'value', type: 'quantitative' },
  ],
  axes: [
    { field: 'category', axisType: 'x', title: 'Category' },
    { field: 'value', axisType: 'y', title: 'Value' },
  ],
  structure: [{ groupby: 'category' }, { groupby: 'value' }],
};

describe('visDomain', () => {
  it('toHypergraph produces a valid graph', () => {
    const graph = visDomain.toHypergraph(spec);
    expect(graph.roots.length).toBeGreaterThan(0);
    expect(graph.edges.size).toBeGreaterThan(0);
  });

  it('registers tokens on runtime', () => {
    createRoot((dispose) => {
      const graph = lowerVisSpec(spec);
      const runtime = createNavigationRuntime<VisPayload>(graph);
      registerDomain(runtime, visDomain);
      const allTokens = runtime.tokens.all();
      const visTokenNames = allTokens.map((t) => t.name);
      expect(visTokenNames).toContain('name');
      expect(visTokenNames).toContain('visType');
      expect(visTokenNames).toContain('aggregate');
      dispose();
    });
  });

  it('registers predicate provider', () => {
    createRoot((dispose) => {
      const graph = lowerVisSpec(spec);
      const runtime = createNavigationRuntime<VisPayload>(graph);
      registerDomain(runtime, visDomain);
      const providers = runtime.predicateProviders.list();
      expect(providers.length).toBeGreaterThan(0);
      dispose();
    });
  });

  it('registers keybindings for x, y, l', () => {
    createRoot((dispose) => {
      const graph = lowerVisSpec(spec);
      const runtime = createNavigationRuntime<VisPayload>(graph);
      registerDomain(runtime, visDomain);
      const keys = runtime.keybindings.list().map((k) => k.key);
      expect(keys).toContain('x');
      expect(keys).toContain('y');
      expect(keys).toContain('l');
      dispose();
    });
  });

  it('registers presets', () => {
    createRoot((dispose) => {
      const graph = lowerVisSpec(spec);
      const runtime = createNavigationRuntime<VisPayload>(graph);
      registerDomain(runtime, visDomain);
      // Applying preset should not throw
      runtime.customization.applyPreset('detailed');
      expect(runtime.customization.activePresetName()).toBe('detailed');
      runtime.customization.applyPreset('standard');
      expect(runtime.customization.activePresetName()).toBe('standard');
      runtime.customization.applyPreset('minimal');
      expect(runtime.customization.activePresetName()).toBe('minimal');
      dispose();
    });
  });

  it('registers dialogs for table, filter, targetedNav', () => {
    createRoot((dispose) => {
      const graph = lowerVisSpec(spec);
      const runtime = createNavigationRuntime<VisPayload>(graph);
      registerDomain(runtime, visDomain);
      expect(runtime.dialogs.byId('table')).toBeDefined();
      expect(runtime.dialogs.byId('filter')).toBeDefined();
      expect(runtime.dialogs.byId('targetedNav')).toBeDefined();
      dispose();
    });
  });

  it('x keybinding jumps to xAxis node', () => {
    createRoot((dispose) => {
      const graph = lowerVisSpec(spec);
      const runtime = createNavigationRuntime<VisPayload>(graph);
      registerDomain(runtime, visDomain);
      const rootId = runtime.navTree().roots[0]!;
      runtime.focus(rootId);
      const event = new KeyboardEvent('keydown', { key: 'x' });
      const consumed = runtime.keybindings.dispatch(runtime, event);
      expect(consumed).toBe(true);
      const focusedNode = runtime.getNavNode(runtime.focusedNavId())!;
      const edge = runtime.getHyperedge(focusedNode.hyperedgeId!)!;
      expect(edge.payload?.nodeType).toBe('xAxis');
      dispose();
    });
  });

  it('y keybinding jumps to yAxis node', () => {
    createRoot((dispose) => {
      const graph = lowerVisSpec(spec);
      const runtime = createNavigationRuntime<VisPayload>(graph);
      registerDomain(runtime, visDomain);
      const rootId = runtime.navTree().roots[0]!;
      runtime.focus(rootId);
      const event = new KeyboardEvent('keydown', { key: 'y' });
      runtime.keybindings.dispatch(runtime, event);
      const focusedNode = runtime.getNavNode(runtime.focusedNavId())!;
      const edge = runtime.getHyperedge(focusedNode.hyperedgeId!)!;
      expect(edge.payload?.nodeType).toBe('yAxis');
      dispose();
    });
  });

  it('predicate provider extracts predicates from VisPayload', () => {
    createRoot((dispose) => {
      const graph = lowerVisSpec(spec);
      const runtime = createNavigationRuntime<VisPayload>(graph);
      registerDomain(runtime, visDomain);
      // Find a filteredData node and check its full predicate
      const rootId = runtime.navTree().roots[0]!;
      const rootNode = runtime.getNavNode(rootId)!;
      const xAxisNavId = rootNode.childNavIds.find((id) => {
        const node = runtime.getNavNode(id)!;
        const edge = runtime.getHyperedge(node.hyperedgeId!)!;
        return edge.payload?.nodeType === 'xAxis';
      })!;
      const xAxisNode = runtime.getNavNode(xAxisNavId)!;
      const childNavId = xAxisNode.childNavIds[0]!;
      const pred = runtime.fullPredicate(childNavId);
      expect(pred).toBeDefined();
      expect('and' in pred).toBe(true);
      dispose();
    });
  });

  it('geo predicate provider passes through region predicates unchanged', () => {
    const geoSpec: UnitOlliVisSpec = {
      data: [
        { id: 1, rate: 0.05, region: 'South', state_name: 'Alabama' },
        { id: 2, rate: 0.10, region: 'West', state_name: 'California' },
        { id: 3, rate: 0.07, region: 'South', state_name: 'Georgia' },
      ],
      mark: 'geoshape',
      fields: [
        { field: 'rate', type: 'quantitative' },
        { field: 'region', type: 'nominal' },
        { field: 'state_name', type: 'nominal' },
      ],
      legends: [{ field: 'rate', channel: 'color' }],
      guides: [{ field: 'region', title: 'Geography' }],
    };
    createRoot((dispose) => {
      const graph = lowerVisSpec(geoSpec);
      const runtime = createNavigationRuntime<VisPayload>(graph);
      registerDomain(runtime, visDomain);
      const southEdge = [...graph.edges.values()].find(
        (e) => e.role === 'filteredData' && e.payload?.predicate?.field === 'region' && e.displayName === 'South',
      )!;
      expect(southEdge).toBeDefined();
      const southNavId = [...runtime.navTree().byNavId.entries()].find(
        ([, node]) => node.hyperedgeId === southEdge.id,
      )![0];
      const pred = runtime.fullPredicate(southNavId);
      expect('and' in pred).toBe(true);
      if ('and' in pred) {
        const regionPred = pred.and.find((p) => 'equal' in p && p.field === 'region');
        expect(regionPred).toBeDefined();
        expect((regionPred as any).equal).toBe('South');
      }
      dispose();
    });
  });
});
