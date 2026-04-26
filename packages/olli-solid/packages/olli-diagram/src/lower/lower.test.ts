import { createRoot } from 'solid-js';
import { describe, expect, it } from 'vitest';
import {
  createNavigationRuntime,
  registerDomain,
  isVirtualNavId,
  VIRTUAL_SUFFIX,
  type MoveDirection,
  type NavigationRuntime,
} from 'olli-core';
import { diagramDomain } from '../domain.js';
import type { DiagramPayload } from '../spec/types.js';
import { pulleySpec } from '../examples/pulley.js';
import { lowerDiagramSpec } from './lower.js';

describe('lowerDiagramSpec', () => {
  it('lowers the pulley spec to a valid hypergraph', () => {
    const g = lowerDiagramSpec(pulleySpec);
    expect(g.roots).toEqual(['root']);
    // 1 root + 11 relations + 13 elements = 25 edges
    expect(g.edges.size).toBe(25);
  });

  it('root has relation IDs as children (no orphan elements)', () => {
    const g = lowerDiagramSpec(pulleySpec);
    const root = g.edges.get('root')!;
    expect(root.displayName).toBe('Pulley diagram');
    expect(root.description).toBe(
      'A compound pulley system with three pulleys, seven ropes, and two boxes.',
    );
    expect(root.children).toEqual([
      'sysB', 'sysA', 'sysC',
      'h-B-l0', 'h-l0-rect', 'h-A-l1', 'h-C-l2', 'a-l3-rect',
      'h-w1-l4', 'h-w2-l5', 'h-w2-l6',
    ]);
  });

  it('relation hyperedges have correct structure', () => {
    const g = lowerDiagramSpec(pulleySpec);

    const sysB = g.edges.get('sysB')!;
    expect(sysB.displayName).toBe('Pulley System B');
    expect(sysB.description).toBe('Contains 3 objects.');
    expect(sysB.role).toBe('grouping');
    expect(sysB.children).toEqual(['B', 'l1', 'l2']);
    expect(sysB.parents).toEqual(['root']);

    const hBl0 = g.edges.get('h-B-l0')!;
    expect(hBl0.displayName).toBe('Pulley B hangs from Axle rope');
    expect(hBl0.description).toBe('Contains 2 objects.');
    expect(hBl0.role).toBe('connection');
    expect(hBl0.children).toEqual(['B', 'l0']);
    expect(hBl0.parents).toEqual(['root']);
  });

  it('element hyperedges have correct structure', () => {
    const g = lowerDiagramSpec(pulleySpec);

    const B = g.edges.get('B')!;
    expect(B.displayName).toBe('Pulley B');
    expect(B.role).toBe('element');
    expect(B.children).toEqual([]);
    expect(B.payload?.sourceElement?.kind).toBe('pulley');

    const rect = g.edges.get('rect')!;
    expect(rect.displayName).toBe('Ceiling');
    expect(rect.role).toBe('element');
  });

  it('element parents are the relations that reference them', () => {
    const g = lowerDiagramSpec(pulleySpec);

    // Pulley B: in sysB and h-B-l0
    expect(g.edges.get('B')!.parents).toEqual(['sysB', 'h-B-l0']);

    // Axle rope l0: in h-B-l0 and h-l0-rect
    expect(g.edges.get('l0')!.parents).toEqual(['h-B-l0', 'h-l0-rect']);

    // Ceiling: in h-l0-rect and a-l3-rect
    expect(g.edges.get('rect')!.parents).toEqual(['h-l0-rect', 'a-l3-rect']);

    // Rope x (l1): in sysB and h-A-l1
    expect(g.edges.get('l1')!.parents).toEqual(['sysB', 'h-A-l1']);

    // Box W2: in h-w2-l5 and h-w2-l6
    expect(g.edges.get('w2')!.parents).toEqual(['h-w2-l5', 'h-w2-l6']);

    // Box W1: in h-w1-l4 only
    expect(g.edges.get('w1')!.parents).toEqual(['h-w1-l4']);
  });

  it('payloads carry source data', () => {
    const g = lowerDiagramSpec(pulleySpec);

    const A = g.edges.get('A')!;
    expect(A.payload?.sourceElement).toEqual({
      id: 'A', label: 'Pulley A', kind: 'pulley',
    });

    const sysA = g.edges.get('sysA')!;
    expect(sysA.payload?.sourceRelation?.kind).toBe('grouping');
    expect(sysA.payload?.sourceRelation?.id).toBe('sysA');
  });

  it('generates displayNames from templates when label is absent', () => {
    const g = lowerDiagramSpec({
      elements: [
        { id: 'a', label: 'Node A' },
        { id: 'b', label: 'Node B' },
        { id: 'c', label: 'Node C' },
      ],
      relations: [
        { kind: 'connection', id: 'c1', endpoints: ['a', 'b'], directed: true, semantic: 'flows-to' },
        { kind: 'connection', id: 'c2', endpoints: ['a', 'b'], directed: true },
        { kind: 'connection', id: 'c3', endpoints: ['a', 'b'] },
        { kind: 'grouping', id: 'g1', members: ['a', 'b', 'c'] },
        { kind: 'alignment', id: 'al1', members: ['a', 'b'], axis: 'horizontal' },
        { kind: 'distribution', id: 'd1', members: ['a', 'b'], direction: 'vertical' },
        { kind: 'containment', id: 'ct1', container: 'a', contents: ['b', 'c'] },
      ],
    });

    expect(g.edges.get('c1')!.displayName).toBe('Node A flows to Node B');
    expect(g.edges.get('c2')!.displayName).toBe('Node A connects to Node B');
    expect(g.edges.get('c3')!.displayName).toBe('Connection: Node A and Node B');
    expect(g.edges.get('g1')!.displayName).toBe('Group of 3: Node A, Node B, Node C');
    expect(g.edges.get('al1')!.displayName).toBe('Aligned horizontal: Node A, Node B');
    expect(g.edges.get('d1')!.displayName).toBe('Distributed vertical: Node A, Node B');
    expect(g.edges.get('ct1')!.displayName).toBe('Node A contains 2 items');
  });

  it('orphan elements become root children', () => {
    const g = lowerDiagramSpec({
      elements: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
      ],
      relations: [
        { kind: 'grouping', id: 'g1', members: ['a', 'b'] },
      ],
    });

    const root = g.edges.get('root')!;
    // g1 + orphan c
    expect(root.children).toEqual(['g1', 'c']);
    expect(g.edges.get('c')!.parents).toEqual(['root']);
    // a and b are NOT root children
    expect(g.edges.get('a')!.parents).toEqual(['g1']);
  });
});

describe('diagramDomain registration', () => {
  it('registers elementKind token and predicate provider', () => {
    createRoot((dispose) => {
      const g = diagramDomain.toHypergraph(pulleySpec);
      const rt = createNavigationRuntime(g);
      registerDomain(rt, diagramDomain);
      expect(rt.tokens.all().map((t) => t.name)).toContain('elementKind');
      expect(rt.predicateProviders.list().length).toBe(1);
      dispose();
    });
  });
});

// --- Navigation acceptance tests ---

function makeRuntime(): NavigationRuntime<DiagramPayload> {
  return createNavigationRuntime(diagramDomain.toHypergraph(pulleySpec));
}

function moves(rt: NavigationRuntime<DiagramPayload>, dirs: MoveDirection[]): string[] {
  const trace: string[] = [rt.focusedNavId()];
  for (const d of dirs) {
    rt.moveFocus(d);
    trace.push(rt.focusedNavId());
  }
  return trace;
}

describe('pulley navigation — basic descent and ascent', () => {
  it('root → sysB → B → (virtual) → sysB → root', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      expect(rt.focusedNavId()).toBe('root');
      const trace = moves(rt, ['down', 'down', 'up', 'up', 'up']);
      expect(trace).toEqual([
        'root',
        'root/sysB',
        'root/sysB/B',
        'root/sysB/B' + VIRTUAL_SUFFIX + '0',
        'root/sysB',
        'root',
      ]);
      dispose();
    });
  });

  it('descriptions contain expected content', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      expect(rt.getDescriptionFor('root')()).toContain('Pulley diagram');
      expect(rt.getDescriptionFor('root/sysB')()).toContain('Pulley System B');
      expect(rt.getDescriptionFor('root/sysB')()).toContain('1 of 11');
      expect(rt.getDescriptionFor('root/sysB/B')()).toContain('Pulley B');
      expect(rt.getDescriptionFor('root/sysB/B')()).toContain('1 of 3');
      dispose();
    });
  });
});

describe('pulley navigation — multi-parent ascent', () => {
  it('Pulley B has 2 virtual parents (sysB and h-B-l0)', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('root/sysB/B');
      rt.moveFocus('up');
      const ids = rt.virtualOptionsFor('root/sysB/B');
      expect(ids).toHaveLength(2);
      const d0 = rt.getDescriptionFor(ids[0]!)();
      expect(d0).toContain('Pulley System B');
      expect(d0).toContain('(default)');
      const d1 = rt.getDescriptionFor(ids[1]!)();
      expect(d1).toContain('Pulley B hangs from Axle rope');
      dispose();
    });
  });

  it('commit non-default parent moves to alternate context', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('root/sysB/B');
      rt.moveFocus('up'); // → virtual sibling 0 (sysB, default)
      rt.moveFocus('right'); // → virtual sibling 1 (h-B-l0)
      expect(rt.focusedNavId()).toBe('root/sysB/B' + VIRTUAL_SUFFIX + '1');
      rt.moveFocus('up'); // commit → h-B-l0
      expect(rt.focusedNavId()).toBe('root/h-B-l0');
      dispose();
    });
  });

  it('Ceiling has 2 parents (h-l0-rect and a-l3-rect)', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('root/h-l0-rect/rect');
      rt.moveFocus('up');
      const ids = rt.virtualOptionsFor('root/h-l0-rect/rect');
      expect(ids).toHaveLength(2);
      const d0 = rt.getDescriptionFor(ids[0]!)();
      expect(d0).toContain('Axle rope hangs from Ceiling');
      const d1 = rt.getDescriptionFor(ids[1]!)();
      expect(d1).toContain('Rope z is anchored to Ceiling');
      dispose();
    });
  });

  it('Box W2 has 2 parents (h-w2-l5 and h-w2-l6)', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('root/h-w2-l5/w2');
      rt.moveFocus('up');
      const ids = rt.virtualOptionsFor('root/h-w2-l5/w2');
      expect(ids).toHaveLength(2);
      const d0 = rt.getDescriptionFor(ids[0]!)();
      expect(d0).toContain('Box W2 hangs from Rope q');
      const d1 = rt.getDescriptionFor(ids[1]!)();
      expect(d1).toContain('Box W2 hangs from Rope s');
      dispose();
    });
  });
});

describe('pulley navigation — cross-system traversal', () => {
  it('descend into sysB, navigate to Rope x, ascend to h-A-l1 (cross-system)', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('root/sysB');
      rt.moveFocus('down'); // → B
      rt.moveFocus('right'); // → l1 (Rope x)
      expect(rt.focusedNavId()).toBe('root/sysB/l1');
      rt.moveFocus('up'); // virtual siblings
      const ids = rt.virtualOptionsFor('root/sysB/l1');
      expect(ids).toHaveLength(2);
      const d0 = rt.getDescriptionFor(ids[0]!)();
      expect(d0).toContain('Pulley System B');
      const d1 = rt.getDescriptionFor(ids[1]!)();
      expect(d1).toContain('Pulley A hangs from Rope x');
      // commit to h-A-l1
      rt.moveFocus('right');
      rt.moveFocus('up');
      expect(rt.focusedNavId()).toBe('root/h-A-l1');
      // descend into h-A-l1 → see Pulley A
      rt.moveFocus('down');
      expect(rt.focusedNavId()).toBe('root/h-A-l1/A');
      dispose();
    });
  });
});

describe('pulley navigation — edge cases', () => {
  it('up from root is a no-op', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.moveFocus('up');
      expect(rt.focusedNavId()).toBe('root');
      dispose();
    });
  });

  it('down on default virtual returns to original source', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('root/sysB/B');
      rt.moveFocus('up');
      expect(rt.focusedNavId()).toBe('root/sysB/B' + VIRTUAL_SUFFIX + '0');
      rt.moveFocus('down');
      expect(rt.focusedNavId()).toBe('root/sysB/B');
      dispose();
    });
  });
});
