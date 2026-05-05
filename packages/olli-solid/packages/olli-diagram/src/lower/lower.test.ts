import { createRoot } from 'solid-js';
import { describe, expect, it } from 'vitest';
import {
  createNavigationRuntime,
  registerDomain,
  isVirtualNavId,
  VIRTUAL_SUFFIX,
  buildNavTree,
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
    // root + 8 connection roots (parentless) = 9 roots
    expect(g.roots).toEqual([
      'root',
      'h-b1-p', 'h-A-q', 'h-C-t', 'h-b2-u',
      'h-q-ceiling', 'h-t-ceiling', 'a-B-v', 'a-v-floor',
    ]);
    // 1 root + 3 groupings + 8 connections + 14 elements = 26 edges
    expect(g.edges.size).toBe(26);
  });

  it('root has structural groupings + orphan non-connector elements as children (connections excluded)', () => {
    const g = lowerDiagramSpec(pulleySpec);
    const root = g.edges.get('root')!;
    expect(root.displayName).toBe('Pulley diagram');
    expect(root.description).toBe(
      'A mechanical system consisting of pulleys, ropes, and boxes.',
    );
    // 3 structural groupings + 4 orphan non-connector elements (ceiling,floor,b1,b2) = 7 children
    expect(root.children).toEqual([
      'sysA', 'sysB', 'sysC',
      'ceiling', 'floor', 'b1', 'b2',
    ]);
  });

  it('group children are members only (no nested connections)', () => {
    const g = lowerDiagramSpec(pulleySpec);

    const sysA = g.edges.get('sysA')!;
    expect(sysA.displayName).toBe('Pulley System A');
    expect(sysA.description).toBe('Contains 3 objects.');
    expect(sysA.role).toBe('grouping');
    expect(sysA.children).toEqual(['p', 'A', 'r']);
    expect(sysA.parents).toEqual(['root']);

    const sysB = g.edges.get('sysB')!;
    expect(sysB.children).toEqual(['r', 'B', 's']);

    const sysC = g.edges.get('sysC')!;
    expect(sysC.children).toEqual(['s', 'C', 'u']);
  });

  it('all connection relations are parentless roots with contextOnly: true', () => {
    const g = lowerDiagramSpec(pulleySpec);
    for (const id of ['h-b1-p', 'h-A-q', 'h-C-t', 'h-b2-u', 'h-q-ceiling', 'h-t-ceiling', 'a-B-v', 'a-v-floor']) {
      expect(g.edges.get(id)!.parents).toEqual([]);
      expect(g.roots).toContain(id);
      expect(g.edges.get(id)!.contextOnly).toBe(true);
    }
  });

  it('NavTree from lowered pulley has single primary root and 8 contextRoots', () => {
    const g = lowerDiagramSpec(pulleySpec);
    const tree = buildNavTree(g);
    expect(tree.roots).toEqual(['root']);
    expect(tree.contextRoots).toEqual([
      'h-b1-p', 'h-A-q', 'h-C-t', 'h-b2-u',
      'h-q-ceiling', 'h-t-ceiling', 'a-B-v', 'a-v-floor',
    ]);
  });

  it('connection hyperedges have correct structure', () => {
    const g = lowerDiagramSpec(pulleySpec);

    const hAq = g.edges.get('h-A-q')!;
    expect(hAq.displayName).toBe('Pulley A hangs from Rope q');
    expect(hAq.description).toBe('Contains 2 objects.');
    expect(hAq.role).toBe('connection');
    expect(hAq.children).toEqual(['A', 'q']);
    expect(hAq.parents).toEqual([]);

    const aBv = g.edges.get('a-B-v')!;
    expect(aBv.displayName).toBe('Pulley B is anchored to Rope v');
    expect(aBv.children).toEqual(['B', 'v']);
    expect(aBv.parents).toEqual([]);
  });

  it('element hyperedges have correct structure', () => {
    const g = lowerDiagramSpec(pulleySpec);

    const A = g.edges.get('A')!;
    expect(A.displayName).toBe('Pulley A');
    expect(A.role).toBe('element');
    expect(A.children).toEqual([]);
    expect(A.payload?.sourceElement?.kind).toBe('pulley');

    const ceiling = g.edges.get('ceiling')!;
    expect(ceiling.displayName).toBe('Ceiling');
    expect(ceiling.role).toBe('element');
  });

  it('element parents: structural members get structural + referential parents', () => {
    const g = lowerDiagramSpec(pulleySpec);

    // Pulley A: structural parent sysA + connection h-A-q
    expect(g.edges.get('A')!.parents).toEqual(['sysA', 'h-A-q']);

    // Rope p: structural parent sysA + connection h-b1-p
    expect(g.edges.get('p')!.parents).toEqual(['sysA', 'h-b1-p']);

    // Rope r: structural parents sysA + sysB, no connections
    expect(g.edges.get('r')!.parents).toEqual(['sysA', 'sysB']);

    // Pulley B: structural parent sysB + connection a-B-v
    expect(g.edges.get('B')!.parents).toEqual(['sysB', 'a-B-v']);
  });

  it('element parents: structural orphans get root + referential parents', () => {
    const g = lowerDiagramSpec(pulleySpec);

    // Ceiling: orphan → root + h-q-ceiling + h-t-ceiling
    expect(g.edges.get('ceiling')!.parents).toEqual(['root', 'h-q-ceiling', 'h-t-ceiling']);

    // Floor: orphan → root + a-v-floor
    expect(g.edges.get('floor')!.parents).toEqual(['root', 'a-v-floor']);

    // Box B1: orphan → root + h-b1-p
    expect(g.edges.get('b1')!.parents).toEqual(['root', 'h-b1-p']);

    // Box B2: orphan → root + h-b2-u
    expect(g.edges.get('b2')!.parents).toEqual(['root', 'h-b2-u']);
  });

  it('connector orphan elements are NOT root children (accessed through connections)', () => {
    const g = lowerDiagramSpec(pulleySpec);
    const root = g.edges.get('root')!;

    // Ropes q, t, v are connector orphans (not in any group)
    expect(root.children).not.toContain('q');
    expect(root.children).not.toContain('t');
    expect(root.children).not.toContain('v');

    // q: parents are its connection edges only
    expect(g.edges.get('q')!.parents).toEqual(['h-A-q', 'h-q-ceiling']);
    // t: parents are its connection edges only
    expect(g.edges.get('t')!.parents).toEqual(['h-C-t', 'h-t-ceiling']);
    // v: parents are its connection edges only
    expect(g.edges.get('v')!.parents).toEqual(['a-B-v', 'a-v-floor']);
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

  it('non-connector orphan elements become root children', () => {
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

  it('connector orphan element does not appear at root, uses only connection parents', () => {
    const g = lowerDiagramSpec({
      elements: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'rope', label: 'Rope', connector: true },
      ],
      relations: [
        { kind: 'connection', id: 'conn-a-rope', endpoints: ['a', 'rope'] },
        { kind: 'connection', id: 'conn-rope-b', endpoints: ['rope', 'b'] },
      ],
    });

    const root = g.edges.get('root')!;
    expect(root.children).not.toContain('rope');
    expect(g.edges.get('rope')!.parents).toEqual(['conn-a-rope', 'conn-rope-b']);
    expect(root.children).toContain('a');
    expect(root.children).toContain('b');
  });

  it('connections are parentless roots, not nested under groups or root', () => {
    const g = lowerDiagramSpec({
      elements: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
      relations: [
        { kind: 'grouping', id: 'g1', members: ['a'] },
        { kind: 'grouping', id: 'g2', members: ['b'] },
        { kind: 'connection', id: 'c1', endpoints: ['a', 'b'] },
      ],
    });

    const root = g.edges.get('root')!;
    // connection is NOT a child of root
    expect(root.children).not.toContain('c1');
    // connection is a parentless root
    expect(g.edges.get('c1')!.parents).toEqual([]);
    expect(g.roots).toContain('c1');
    // groups do NOT contain the connection
    expect(g.edges.get('g1')!.children).not.toContain('c1');
    expect(g.edges.get('g2')!.children).not.toContain('c1');
  });

  it('connection with all orphan endpoints is a parentless root', () => {
    const g = lowerDiagramSpec({
      elements: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
      relations: [
        { kind: 'connection', id: 'c1', endpoints: ['a', 'b'] },
      ],
    });

    const root = g.edges.get('root')!;
    expect(root.children).not.toContain('c1');
    expect(g.edges.get('c1')!.parents).toEqual([]);
    expect(g.roots).toContain('c1');
    // orphan non-connector elements still appear at root
    expect(root.children).toContain('a');
    expect(root.children).toContain('b');
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
  it('root → sysA → p → (virtual) → sysA → root', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      expect(rt.focusedNavId()).toBe('root');
      const trace = moves(rt, ['down', 'down', 'up', 'up', 'up']);
      expect(trace).toEqual([
        'root',
        'root/sysA',
        'root/sysA/p',
        'root/sysA/p' + VIRTUAL_SUFFIX + '0',
        'root/sysA',
        'root',
      ]);
      dispose();
    });
  });

  it('descriptions contain expected content', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      expect(rt.getDescriptionFor('root')()).toContain('Pulley diagram');
      expect(rt.getDescriptionFor('root/sysA')()).toContain('Pulley System A');
      expect(rt.getDescriptionFor('root/sysA')()).toContain('1 of 7');
      expect(rt.getDescriptionFor('root/sysA/p')()).toContain('Rope p');
      expect(rt.getDescriptionFor('root/sysA/p')()).toContain('1 of 3');
      dispose();
    });
  });
});

describe('pulley navigation — multi-parent ascent', () => {
  it('Pulley A has 2 virtual parents (sysA and h-A-q)', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('root/sysA/A');
      rt.moveFocus('up');
      const ids = rt.virtualOptionsFor('root/sysA/A');
      expect(ids).toHaveLength(2);
      const d0 = rt.getDescriptionFor(ids[0]!)();
      expect(d0).toContain('Pulley System A');
      expect(d0).toContain('(default)');
      const d1 = rt.getDescriptionFor(ids[1]!)();
      expect(d1).toContain('Pulley A hangs from Rope q');
      dispose();
    });
  });

  it('commit non-default parent moves to connection at root level', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('root/sysA/A');
      rt.moveFocus('up'); // → virtual sibling 0 (sysA, default)
      rt.moveFocus('right'); // → virtual sibling 1 (h-A-q)
      expect(rt.focusedNavId()).toBe('root/sysA/A' + VIRTUAL_SUFFIX + '1');
      rt.moveFocus('up'); // commit → h-A-q (now a parentless root)
      expect(rt.focusedNavId()).toBe('h-A-q');
      // descend into h-A-q → see Pulley A
      rt.moveFocus('down');
      expect(rt.focusedNavId()).toBe('h-A-q/A');
      dispose();
    });
  });

  it('Ceiling has 3 virtual parents (root, h-q-ceiling, h-t-ceiling)', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('root/ceiling');
      rt.moveFocus('up');
      const ids = rt.virtualOptionsFor('root/ceiling');
      expect(ids).toHaveLength(3);
      const allText = ids.map(id => rt.getDescriptionFor(id!)()).join(' ');
      expect(allText).toContain('Rope q hangs from Ceiling');
      expect(allText).toContain('Rope t hangs from Ceiling');
      dispose();
    });
  });
});

describe('pulley navigation — cross-system traversal', () => {
  it('descend into sysA, navigate to Rope r, ascend to sysB', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('root/sysA');
      rt.moveFocus('down'); // → p (first child of sysA)
      rt.moveFocus('right'); // → A
      rt.moveFocus('right'); // → r (third child)
      expect(rt.focusedNavId()).toBe('root/sysA/r');
      rt.moveFocus('up');
      const ids = rt.virtualOptionsFor('root/sysA/r');
      expect(ids).toHaveLength(2);
      const d0 = rt.getDescriptionFor(ids[0]!)();
      expect(d0).toContain('Pulley System A');
      const d1 = rt.getDescriptionFor(ids[1]!)();
      expect(d1).toContain('Pulley System B');
      // commit to sysB
      rt.moveFocus('right');
      rt.moveFocus('up');
      expect(rt.focusedNavId()).toBe('root/sysB');
      rt.moveFocus('down');
      expect(rt.focusedNavId()).toBe('root/sysB/r');
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
      rt.focus('root/sysA/p');
      rt.moveFocus('up');
      expect(rt.focusedNavId()).toBe('root/sysA/p' + VIRTUAL_SUFFIX + '0');
      rt.moveFocus('down');
      expect(rt.focusedNavId()).toBe('root/sysA/p');
      dispose();
    });
  });
});
