import { describe, expect, it } from 'vitest';
import { elaborateSpec } from '../../src/util/elaborate';
import { olliSpecToTree } from '../../src/Structure';
import type { UnitOlliSpec, MultiOlliSpec } from '../../src/Types';
import type { ElaboratedOlliNode } from '../../src/Structure/Types';

// Strip ids/descriptions/parents so the shape is compared, not identities.
const summarize = (node: ElaboratedOlliNode): unknown => ({
  nodeType: node.nodeType,
  level: node.level,
  viewType: node.viewType,
  groupby: node.groupby,
  hasPredicate: !!node.predicate,
  children: node.children.map(summarize),
});

describe('olliSpecToTree (hand-written specs)', () => {
  it('builds an xAxis branch for a simple nominal-bar chart', () => {
    const spec: UnitOlliSpec = {
      mark: 'bar',
      data: [
        { cat: 'A', value: 10 },
        { cat: 'B', value: 20 },
        { cat: 'C', value: 30 },
      ],
      fields: [
        { field: 'cat', type: 'nominal' },
        { field: 'value', type: 'quantitative' },
      ],
      axes: [
        { axisType: 'x', field: 'cat' },
        { axisType: 'y', field: 'value' },
      ],
      legends: [],
    };
    const tree = olliSpecToTree(elaborateSpec(spec));
    // bar-chart infer drops the quant axis, leaving only the x-axis branch;
    // `ensureFirstLayerHasOneRoot` wraps solo axis nodes in a synthetic root.
    expect(tree.nodeType).toBe('root');
    expect(tree.children).toHaveLength(1);
    const xAxis = tree.children[0];
    expect(xAxis.nodeType).toBe('xAxis');
    expect(xAxis.groupby).toBe('cat');
    expect(xAxis.children).toHaveLength(3);
    xAxis.children.forEach((child) => {
      expect(child.nodeType).toBe('filteredData');
      expect(child.predicate).toBeDefined();
    });
  });

  it('facets on color for a multi-series line chart', () => {
    const spec: UnitOlliSpec = {
      mark: 'line',
      data: [
        { date: new Date('2024-01-01'), price: 100, symbol: 'AAPL' },
        { date: new Date('2024-02-01'), price: 110, symbol: 'AAPL' },
        { date: new Date('2024-01-01'), price: 50, symbol: 'MSFT' },
        { date: new Date('2024-02-01'), price: 55, symbol: 'MSFT' },
      ],
      fields: [
        { field: 'date', type: 'temporal' },
        { field: 'price', type: 'quantitative' },
        { field: 'symbol', type: 'nominal' },
      ],
      axes: [
        { axisType: 'x', field: 'date' },
        { axisType: 'y', field: 'price' },
      ],
      legends: [{ channel: 'color', field: 'symbol' }],
    };
    const tree = olliSpecToTree(elaborateSpec(spec));
    expect(tree.nodeType).toBe('legend');
    expect(tree.groupby).toBe('symbol');
    // one child per series, each a filteredData wrapper.
    expect(tree.children).toHaveLength(2);
    // the filteredData children expand into x/y axes of the individual series.
    tree.children.forEach((child) => {
      expect(child.nodeType).toBe('filteredData');
      const axisTypes = child.children.map((c) => c.nodeType).sort();
      expect(axisTypes).toEqual(['xAxis', 'yAxis']);
    });
  });

  it('roots a facet chart on the facet field', () => {
    const spec: UnitOlliSpec = {
      mark: 'bar',
      facet: 'region',
      data: [
        { region: 'N', cat: 'A', value: 10 },
        { region: 'N', cat: 'B', value: 12 },
        { region: 'S', cat: 'A', value: 20 },
        { region: 'S', cat: 'B', value: 22 },
      ],
      fields: [
        { field: 'region', type: 'nominal' },
        { field: 'cat', type: 'nominal' },
        { field: 'value', type: 'quantitative' },
      ],
      axes: [
        { axisType: 'x', field: 'cat' },
        { axisType: 'y', field: 'value' },
      ],
      legends: [],
    };
    const tree = olliSpecToTree(elaborateSpec(spec));
    // Top node is the facet grouping → its nodeType is 'root'.
    expect(tree.nodeType).toBe('root');
    expect(tree.groupby).toBe('region');
    expect(tree.children).toHaveLength(2);
    tree.children.forEach((view) => {
      expect(view.nodeType).toBe('view');
      expect(view.viewType).toBe('facet');
    });
  });

  it('wraps multiple top-level children in a synthetic root', () => {
    const spec: MultiOlliSpec = {
      operator: 'layer',
      units: [
        {
          mark: 'point',
          data: [
            { x: 1, y: 2 },
            { x: 3, y: 4 },
          ],
          fields: [
            { field: 'x', type: 'quantitative' },
            { field: 'y', type: 'quantitative' },
          ],
          axes: [
            { axisType: 'x', field: 'x' },
            { axisType: 'y', field: 'y' },
          ],
          legends: [],
        },
        {
          mark: 'line',
          data: [
            { x: 1, y: 2 },
            { x: 3, y: 4 },
          ],
          fields: [
            { field: 'x', type: 'quantitative' },
            { field: 'y', type: 'quantitative' },
          ],
          axes: [
            { axisType: 'x', field: 'x' },
            { axisType: 'y', field: 'y' },
          ],
          legends: [],
        },
      ],
    };
    const tree = olliSpecToTree(elaborateSpec(spec));
    expect(tree.nodeType).toBe('root');
    expect(tree.children).toHaveLength(2);
    tree.children.forEach((view) => {
      expect(view.nodeType).toBe('view');
      expect(view.viewType).toBe('layer');
    });
  });

  it('postProcess wires parent refs and descriptions', () => {
    const spec: UnitOlliSpec = {
      mark: 'bar',
      data: [
        { cat: 'A', value: 10 },
        { cat: 'B', value: 20 },
      ],
      fields: [
        { field: 'cat', type: 'nominal' },
        { field: 'value', type: 'quantitative' },
      ],
      axes: [
        { axisType: 'x', field: 'cat' },
        { axisType: 'y', field: 'value' },
      ],
      legends: [],
    };
    const tree = olliSpecToTree(elaborateSpec(spec));

    // parent back-refs set everywhere except the root.
    const queue: ElaboratedOlliNode[] = [tree];
    while (queue.length) {
      const node = queue.shift()!;
      for (const child of node.children) {
        expect(child.parent).toBe(node);
        queue.push(child);
      }
    }

    // description map is non-empty on every node (renderer relies on this).
    const walk = (node: ElaboratedOlliNode) => {
      expect(node.description.size).toBeGreaterThan(0);
      node.children.forEach(walk);
    };
    walk(tree);
  });

  it('is deterministic given the setup Math.random stub', () => {
    const spec: UnitOlliSpec = {
      mark: 'bar',
      data: [
        { cat: 'A', value: 10 },
        { cat: 'B', value: 20 },
      ],
      fields: [
        { field: 'cat', type: 'nominal' },
        { field: 'value', type: 'quantitative' },
      ],
      axes: [
        { axisType: 'x', field: 'cat' },
        { axisType: 'y', field: 'value' },
      ],
      legends: [],
    };
    // beforeEach in setup.ts resets the seed between tests, not within a test,
    // so two consecutive builds here produce different namespace ids — but the
    // normalized shape should still be identical.
    const a = summarize(olliSpecToTree(elaborateSpec(structuredClone(spec))));
    const b = summarize(olliSpecToTree(elaborateSpec(structuredClone(spec))));
    expect(a).toEqual(b);
  });
});
