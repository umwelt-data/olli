import { describe, it, expect, beforeEach } from 'vitest';
import { BluefishAdapter } from './BluefishAdapter.js';
import type { BluefishKit } from './BluefishAdapter.js';
import type { DiagramSpec, ConnectionRelation, GroupingRelation } from 'olli-diagram';

// === Unit tests: element extraction ===

describe('element extraction', () => {
  it('extracts named primitive', () => {
    const spec = BluefishAdapter(({ Rect }) => [Rect({ name: 'box' })]);
    expect(spec.elements).toEqual([{ id: 'box', label: 'box', kind: 'rect' }]);
  });

  it('extracts named Circle with correct kind', () => {
    const spec = BluefishAdapter(({ Circle }) => [Circle({ name: 'c1', r: 10 })]);
    expect(spec.elements).toEqual([{ id: 'c1', label: 'c1', kind: 'circle' }]);
  });

  it('extracts named Text with string child as label', () => {
    const spec = BluefishAdapter(({ Text }) => [Text({ name: 't1' }, 'hello')]);
    expect(spec.elements).toEqual([{ id: 't1', label: 'hello', kind: 'text' }]);
  });

  it('extracts named composite (Align with non-Ref children) as single element', () => {
    const spec = BluefishAdapter(({ Align, Circle }) => [
      Align({ name: 'A', alignment: 'center' }, [
        Circle({ r: 25 }),
        Circle({ r: 5 }),
      ]),
    ]);
    expect(spec.elements).toEqual([{ id: 'A', label: 'A', kind: 'align' }]);
    expect(spec.relations).toHaveLength(0);
  });

  it('extracts named StackH composite as single element', () => {
    const spec = BluefishAdapter(({ StackH, Rect }) => [
      StackH({ name: 'w1' }, [Rect({ fill: 'red' }), Rect({ fill: 'blue' })]),
    ]);
    expect(spec.elements).toEqual([{ id: 'w1', label: 'w1', kind: 'stackh' }]);
  });

  it('skips elements whose name ends in copy', () => {
    const spec = BluefishAdapter(({ Circle }) => [Circle({ name: 'Acopy' })]);
    expect(spec.elements).toHaveLength(0);
  });

  it('deduplicates elements by id', () => {
    const spec = BluefishAdapter(({ Rect, Align, Ref }) => [
      Rect({ name: 'box' }),
      Align({ alignment: 'centerX' }, [Ref({ select: 'box' }), Ref({ select: 'box' })]),
    ]);
    const boxElements = spec.elements.filter(e => e.id === 'box');
    expect(boxElements).toHaveLength(1);
  });
});

// === Unit tests: alias support ===

describe('alias support', () => {
  it('skipped primitive with alias resolves endpoint in Line connections', () => {
    const spec = BluefishAdapter(({ Circle, Rect, Line, Ref }) => [
      Rect({ name: 'a' }),
      Rect({ name: 'b' }),
      Circle({ name: 'a-anchor', r: 1, customData: { olli: { skip: true, alias: 'a' } } }),
      Line({ name: 'rope', stroke: 'black' }, [Ref({ select: 'a-anchor' }), Ref({ select: 'b' })]),
    ]);
    const connections = spec.relations.filter(r => r.kind === 'connection') as ConnectionRelation[];
    expect(connections).toHaveLength(2);
    expect(connections.find(c => c.endpoints[0] === 'a' && c.endpoints[1] === 'rope')).toBeDefined();
    expect(connections.find(c => c.endpoints[0] === 'rope' && c.endpoints[1] === 'b')).toBeDefined();
    expect(spec.elements.some(e => e.id === 'a-anchor')).toBe(false);
  });

  it('skipped inline child with alias in named composite resolves endpoint in Line connections', () => {
    const spec = BluefishAdapter(({ Align, Circle, Rect, Line, Ref }) => [
      Rect({ name: 'b' }),
      Align({ name: 'A', alignment: 'center', customData: { olli: { kind: 'pulley', label: 'Pulley A' } } }, [
        Circle({ r: 25 }),
        Circle({ name: 'A-center', r: 5, customData: { olli: { skip: true, alias: 'A' } } }),
      ]),
      Line({ name: 'rope', stroke: 'black' }, [Ref({ select: 'b' }), Ref({ select: 'A-center' })]),
    ]);
    const connections = spec.relations.filter(r => r.kind === 'connection') as ConnectionRelation[];
    expect(connections).toHaveLength(2);
    expect(connections.find(c => c.endpoints[0] === 'b' && c.endpoints[1] === 'rope')).toBeDefined();
    expect(connections.find(c => c.endpoints[0] === 'rope' && c.endpoints[1] === 'A')).toBeDefined();
    expect(spec.elements.some(e => e.id === 'A-center')).toBe(false);
  });
});

// === Unit tests: customData ===

describe('customData.olli overrides', () => {
  it('overrides kind on named primitive', () => {
    const spec = BluefishAdapter(({ Circle }) => [
      Circle({ name: 'c1', r: 10, customData: { olli: { kind: 'neuron' } } }),
    ]);
    expect(spec.elements[0]).toEqual({ id: 'c1', label: 'c1', kind: 'neuron' });
  });

  it('overrides label on named primitive', () => {
    const spec = BluefishAdapter(({ Rect }) => [
      Rect({ name: 'r1', customData: { olli: { label: 'My Box' } } }),
    ]);
    expect(spec.elements[0]?.label).toBe('My Box');
  });

  it('overrides label on named composite (no-Ref children)', () => {
    const spec = BluefishAdapter(({ Align, Circle }) => [
      Align({ name: 'A', alignment: 'center', customData: { olli: { kind: 'pulley', label: 'Pulley A' } } }, [
        Circle({ r: 25 }),
        Circle({ r: 5 }),
      ]),
    ]);
    expect(spec.elements[0]).toEqual({ id: 'A', label: 'Pulley A', kind: 'pulley' });
  });

  it('skip suppresses named element', () => {
    const spec = BluefishAdapter(({ Text }) => [
      Text({ name: 't1', customData: { olli: { skip: true } } }, 'hello'),
    ]);
    expect(spec.elements).toHaveLength(0);
  });

  it('skip suppresses inline named element and excludes it from relation members', () => {
    const spec = BluefishAdapter(({ Rect, StackH, Ref, Text }) => [
      Rect({ name: 'l1' }),
      StackH({ spacing: 5 }, [Ref({ select: 'l1' }), Text({ name: 't1', customData: { olli: { skip: true } } }, 'x')]),
    ]);
    expect(spec.elements.some(e => e.id === 't1')).toBe(false);
    expect(spec.relations).toHaveLength(0);
  });

  it('adds semantic and directed to both endpoint connections from named Line', () => {
    const spec = BluefishAdapter(({ Rect, Line, Ref }) => [
      Rect({ name: 'a' }),
      Rect({ name: 'b' }),
      Line({ name: 'l1', customData: { olli: { semantic: 'flows-to', directed: true } } }, [
        Ref({ select: 'a' }),
        Ref({ select: 'b' }),
      ]),
    ]);
    const connections = spec.relations.filter(r => r.kind === 'connection') as ConnectionRelation[];
    expect(connections).toHaveLength(2);
    expect(connections.every(c => c.semantic === 'flows-to')).toBe(true);
    expect(connections.every(c => c.directed === true)).toBe(true);
  });

  it('adds label to Group from customData', () => {
    const spec = BluefishAdapter(({ Rect, Group, Ref }) => [
      Rect({ name: 'a' }),
      Rect({ name: 'b' }),
      Group({ name: 'G', customData: { olli: { label: 'My Group' } } }, [
        Ref({ select: 'a' }),
        Ref({ select: 'b' }),
      ]),
    ]);
    const rel = spec.relations.find(r => r.kind === 'grouping') as GroupingRelation;
    expect(rel.label).toBe('My Group');
  });
});

// === Unit tests: relation extraction ===

describe('connection relations', () => {
  it('extracts named Line as connector element + two endpoint connections', () => {
    const spec = BluefishAdapter(({ Rect, Line, Ref }) => [
      Rect({ name: 'a' }),
      Rect({ name: 'b' }),
      Line({ name: 'l1', stroke: 'black' }, [Ref({ select: 'a' }), Ref({ select: 'b' })]),
    ]);
    expect(spec.elements.some(e => e.id === 'l1')).toBe(true);
    expect(spec.elements.find(e => e.id === 'l1')?.connector).toBe(true);

    const connections = spec.relations.filter(r => r.kind === 'connection') as ConnectionRelation[];
    expect(connections).toHaveLength(2);
    const conn0 = connections.find(c => c.endpoints[0] === 'a' && c.endpoints[1] === 'l1');
    expect(conn0).toBeDefined();
    expect(conn0?.id).toBe('connection-a-l1');
    expect(conn0?.directed).toBeUndefined();
    const conn1 = connections.find(c => c.endpoints[0] === 'l1' && c.endpoints[1] === 'b');
    expect(conn1).toBeDefined();
    expect(conn1?.id).toBe('connection-l1-b');
  });

  it('same-group suppression removes connections where both endpoints share a group', () => {
    const spec = BluefishAdapter(({ Rect, Line, Group, Ref }) => [
      Rect({ name: 'a' }),
      Rect({ name: 'b' }),
      Rect({ name: 'c' }),
      Line({ name: 'rope', stroke: 'black' }, [Ref({ select: 'a' }), Ref({ select: 'b' })]),
      Group({ name: 'sys' }, [Ref({ select: 'a' }), Ref({ select: 'rope' })]),
    ]);
    // (a, rope): both in sys → suppressed; (rope, b): rope in sys, b not → kept
    const connections = spec.relations.filter(r => r.kind === 'connection') as ConnectionRelation[];
    expect(connections).toHaveLength(1);
    expect(connections[0]?.endpoints).toEqual(['rope', 'b']);
  });

  it('named Line with no group membership keeps both endpoint connections', () => {
    const spec = BluefishAdapter(({ Rect, Line, Ref }) => [
      Rect({ name: 'x' }),
      Rect({ name: 'y' }),
      Line({ name: 'rope', stroke: 'black' }, [Ref({ select: 'x' }), Ref({ select: 'y' })]),
    ]);
    const connections = spec.relations.filter(r => r.kind === 'connection') as ConnectionRelation[];
    expect(connections).toHaveLength(2);
    expect(connections.map(c => c.endpoints)).toContainEqual(['x', 'rope']);
    expect(connections.map(c => c.endpoints)).toContainEqual(['rope', 'y']);
  });

  it('unnamed Line still creates single endpoint-to-endpoint connection (backward compat)', () => {
    const spec = BluefishAdapter(({ Rect, Line, Ref }) => [
      Rect({ name: 'a' }),
      Rect({ name: 'b' }),
      Line({ stroke: 'black' }, [Ref({ select: 'a' }), Ref({ select: 'b' })]),
    ]);
    const connections = spec.relations.filter(r => r.kind === 'connection') as ConnectionRelation[];
    expect(connections).toHaveLength(1);
    expect(connections[0]?.endpoints).toEqual(['a', 'b']);
  });

  it('extracts Arrow as directed connection', () => {
    const spec = BluefishAdapter(({ Rect, Arrow, Ref }) => [
      Rect({ name: 'start' }),
      Rect({ name: 'end' }),
      Arrow({}, [Ref({ select: 'start' }), Ref({ select: 'end' })]),
    ]);
    const conn = spec.relations.find(r => r.kind === 'connection') as ConnectionRelation;
    expect(conn).toBeDefined();
    expect(conn.directed).toBe(true);
    expect(conn.endpoints).toEqual(['start', 'end']);
  });

  it('skips connections involving copy endpoints', () => {
    const spec = BluefishAdapter(({ Rect, Line, Ref }) => [
      Rect({ name: 'a' }),
      Line({ name: 'l1copy' }, [Ref({ select: 'a' }), Ref({ select: 'b' })]),
    ]);
    expect(spec.relations.filter(r => r.kind === 'connection')).toHaveLength(0);
    expect(spec.elements.some(e => e.id === 'l1copy')).toBe(false);
  });
});

describe('grouping relations', () => {
  it('extracts named Group as grouping relation', () => {
    const spec = BluefishAdapter(({ Rect, Group, Ref }) => [
      Rect({ name: 'a' }),
      Rect({ name: 'b' }),
      Rect({ name: 'c' }),
      Group({ name: 'G' }, [Ref({ select: 'a' }), Ref({ select: 'b' }), Ref({ select: 'c' })]),
    ]);
    const rel = spec.relations.find(r => r.kind === 'grouping') as GroupingRelation;
    expect(rel).toBeDefined();
    expect(rel.id).toBe('G');
    expect(rel.members).toEqual(['a', 'b', 'c']);
    expect(spec.elements.some(e => e.id === 'G')).toBe(false);
  });
});

// === Unit tests: layout relation suppression ===

describe('layout relation suppression', () => {
  it('Align with Ref children does not emit alignment relation', () => {
    const spec = BluefishAdapter(({ Rect, Align, Ref }) => [
      Rect({ name: 'a' }),
      Rect({ name: 'b' }),
      Align({ alignment: 'centerX' }, [Ref({ select: 'a' }), Ref({ select: 'b' })]),
    ]);
    expect(spec.relations.filter(r => r.kind === 'alignment')).toHaveLength(0);
  });

  it('Distribute with Ref children does not emit distribution relation', () => {
    const spec = BluefishAdapter(({ Rect, Distribute, Ref }) => [
      Rect({ name: 'a' }),
      Rect({ name: 'b' }),
      Distribute({ direction: 'horizontal', spacing: 10 }, [Ref({ select: 'a' }), Ref({ select: 'b' })]),
    ]);
    expect(spec.relations.filter(r => r.kind === 'distribution')).toHaveLength(0);
  });

  it('StackH with Ref children does not emit distribution relation', () => {
    const spec = BluefishAdapter(({ Rect, StackH, Ref }) => [
      Rect({ name: 'a' }),
      Rect({ name: 'b' }),
      StackH({ spacing: 5 }, [Ref({ select: 'a' }), Ref({ select: 'b' })]),
    ]);
    expect(spec.relations.filter(r => r.kind === 'distribution')).toHaveLength(0);
  });

  it('Align with customData.olli still emits alignment relation (opt-in)', () => {
    const spec = BluefishAdapter(({ Rect, Align, Ref }) => [
      Rect({ name: 'a' }),
      Rect({ name: 'b' }),
      Align({ alignment: 'centerX', customData: { olli: { label: 'semantic alignment' } } }, [
        Ref({ select: 'a' }),
        Ref({ select: 'b' }),
      ]),
    ]);
    const aligns = spec.relations.filter(r => r.kind === 'alignment');
    expect(aligns).toHaveLength(1);
  });
});

// === Unit tests: mixed children ===

describe('mixed children (Ref + inline)', () => {
  it('extracts named inline element but does not emit layout relation', () => {
    const spec = BluefishAdapter(({ Rect, StackH, Ref, Text }) => [
      Rect({ name: 'l1' }),
      StackH({ spacing: 5 }, [Ref({ select: 'l1' }), Text({ name: 't1' }, 'x')]),
    ]);
    expect(spec.elements.some(e => e.id === 't1' && e.label === 'x')).toBe(true);
    expect(spec.relations.filter(r => r.kind === 'distribution')).toHaveLength(0);
  });

  it('recurses into unnamed inline children for element extraction without emitting relation', () => {
    const spec = BluefishAdapter(({ Align, Circle, Ref, Rect }) => [
      Rect({ name: 'anchor' }),
      Align({ alignment: 'center' }, [
        Ref({ select: 'anchor' }),
        Circle({ name: 'dot' }),
      ]),
    ]);
    expect(spec.elements.some(e => e.id === 'dot')).toBe(true);
    expect(spec.relations.filter(r => r.kind === 'alignment')).toHaveLength(0);
  });
});

// === Integration test: benthic pulley ===

const pr = 25;

function benthicPulleySpec({ Align, Circle, Distribute, Group, Line, Path, Rect, Ref, StackH, Text }: BluefishKit): unknown[] {
  function pulleyCircle(name: string, label: string) {
    return Align({ name, alignment: 'center', customData: { olli: { kind: 'pulley', label } } }, [
      Circle({ r: pr, stroke: '#828282', 'stroke-width': 3, fill: '#C1C1C1' }),
      Circle({ r: 5, fill: '#555555' }),
    ]);
  }
  function weightBox(name: string, label: string, wlabel: string) {
    return StackH({ name, customData: { olli: { kind: 'box', label } } }, [
      Align({ alignment: 'center' }, [
        Path({ d: `M 10,0 l 20,0 l 10,30 l -40,0 Z`, fill: '#545454', stroke: '#545454' }),
        Text({ 'font-size': '10' }, wlabel),
      ]),
    ]);
  }

  return [
    Rect({ name: 'ceiling', height: 20, width: 12 * pr, fill: '#C9C9C9', 'stroke-width': 2, customData: { olli: { label: 'Ceiling' } } }),
    Rect({ name: 'floor', height: 20, width: 4 * pr, fill: '#C9C9C9', 'stroke-width': 2, customData: { olli: { label: 'Floor' } } }),

    pulleyCircle('A', 'Pulley A'),
    pulleyCircle('B', 'Pulley B'),
    pulleyCircle('C', 'Pulley C'),
    weightBox('b1', 'Box B1', 'B1'),
    weightBox('b2', 'Box B2', 'B2'),

    Distribute({ direction: 'horizontal', spacing: 4 * pr }, [Ref({ select: 'A' }), Ref({ select: 'C' })]),
    Distribute({ direction: 'vertical', spacing: 50 }, [Ref({ select: 'ceiling' }), Ref({ select: 'A' })]),
    Distribute({ direction: 'vertical', spacing: 50 }, [Ref({ select: 'ceiling' }), Ref({ select: 'C' })]),
    Distribute({ direction: 'horizontal', spacing: pr }, [Ref({ select: 'A' }), Ref({ select: 'B' })]),
    Distribute({ direction: 'vertical', spacing: 50 }, [Ref({ select: 'A' }), Ref({ select: 'B' })]),
    Distribute({ direction: 'vertical', spacing: 70 }, [Ref({ select: 'A' }), Ref({ select: 'b1' })]),
    Distribute({ direction: 'vertical', spacing: 70 }, [Ref({ select: 'C' }), Ref({ select: 'b2' })]),
    Distribute({ direction: 'vertical', spacing: 60 }, [Ref({ select: 'B' }), Ref({ select: 'floor' })]),

    Line({ name: 'q', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope q', semantic: 'hangs-from', directed: true } } }, [Ref({ select: 'ceiling' }), Ref({ select: 'A' })]),
    Line({ name: 't', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope t', semantic: 'hangs-from', directed: true } } }, [Ref({ select: 'ceiling' }), Ref({ select: 'C' })]),
    Line({ name: 'p', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope p', semantic: 'hangs-from', directed: true } } }, [Ref({ select: 'A' }), Ref({ select: 'b1' })]),
    Line({ name: 'r', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope r' } } }, [Ref({ select: 'A' }), Ref({ select: 'B' })]),
    Line({ name: 's', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope s' } } }, [Ref({ select: 'B' }), Ref({ select: 'C' })]),
    Line({ name: 'u', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope u', semantic: 'hangs-from', directed: true } } }, [Ref({ select: 'C' }), Ref({ select: 'b2' })]),
    Line({ name: 'v', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope v', semantic: 'anchored-to', directed: true } } }, [Ref({ select: 'B' }), Ref({ select: 'floor' })]),

    Group({ name: 'sysA', customData: { olli: { label: 'Pulley System A' } } }, [Ref({ select: 'A' }), Ref({ select: 'p' }), Ref({ select: 'r' })]),
    Group({ name: 'sysB', customData: { olli: { label: 'Pulley System B' } } }, [Ref({ select: 'r' }), Ref({ select: 'B' }), Ref({ select: 's' })]),
    Group({ name: 'sysC', customData: { olli: { label: 'Pulley System C' } } }, [Ref({ select: 's' }), Ref({ select: 'C' }), Ref({ select: 'u' })]),
  ];
}

describe('pulley integration test', () => {
  let spec: DiagramSpec;

  beforeEach(() => {
    spec = BluefishAdapter(benthicPulleySpec);
  });

  it('extracts 14 elements (7 ropes as connectors, 3 pulleys, ceiling, floor, b1, b2)', () => {
    expect(spec.elements).toHaveLength(14);
    const ids = spec.elements.map(e => e.id);
    expect(ids).toContain('ceiling');
    expect(ids).toContain('floor');
    expect(ids).toContain('A');
    expect(ids).toContain('B');
    expect(ids).toContain('C');
    expect(ids).toContain('p');
    expect(ids).toContain('q');
    expect(ids).toContain('r');
    expect(ids).toContain('s');
    expect(ids).toContain('t');
    expect(ids).toContain('u');
    expect(ids).toContain('v');
    expect(ids).toContain('b1');
    expect(ids).toContain('b2');
  });

  it('all rope elements have connector: true', () => {
    for (const rope of ['p', 'q', 'r', 's', 't', 'u', 'v']) {
      expect(spec.elements.find(e => e.id === rope)?.connector).toBe(true);
    }
  });

  it('applies customData kind/label overrides', () => {
    expect(spec.elements.find(e => e.id === 'A')).toMatchObject({ kind: 'pulley', label: 'Pulley A' });
    expect(spec.elements.find(e => e.id === 'p')).toMatchObject({ kind: 'rope', label: 'Rope p' });
    expect(spec.elements.find(e => e.id === 'b1')).toMatchObject({ kind: 'box', label: 'Box B1' });
    expect(spec.elements.find(e => e.id === 'ceiling')).toMatchObject({ label: 'Ceiling' });
  });

  it('does not emit alignment or distribution relations', () => {
    expect(spec.relations.filter(r => r.kind === 'alignment')).toHaveLength(0);
    expect(spec.relations.filter(r => r.kind === 'distribution')).toHaveLength(0);
  });

  it('extracts exactly 8 connections after same-group suppression', () => {
    const connections = spec.relations.filter(r => r.kind === 'connection') as ConnectionRelation[];
    expect(connections).toHaveLength(8);
    const pairs = connections.map(c => c.endpoints);
    expect(pairs).toContainEqual(['p', 'b1']);
    expect(pairs).toContainEqual(['ceiling', 'q']);
    expect(pairs).toContainEqual(['q', 'A']);
    expect(pairs).toContainEqual(['ceiling', 't']);
    expect(pairs).toContainEqual(['t', 'C']);
    expect(pairs).toContainEqual(['u', 'b2']);
    expect(pairs).toContainEqual(['B', 'v']);
    expect(pairs).toContainEqual(['v', 'floor']);
  });

  it('suppresses intra-group connections (r and s have no connections)', () => {
    const connections = spec.relations.filter(r => r.kind === 'connection') as ConnectionRelation[];
    const pairs = connections.map(c => c.endpoints);
    // r: A→B both suppressed; s: B→C both suppressed; p: A→p suppressed
    expect(pairs.some(([a, b]) => a === 'r' || b === 'r')).toBe(false);
    expect(pairs.some(([a, b]) => a === 's' || b === 's')).toBe(false);
    expect(pairs.some(([a, b]) => (a === 'A' && b === 'p') || (a === 'p' && b === 'A'))).toBe(false);
  });

  it('connections carry semantic and directed from customData', () => {
    const connections = spec.relations.filter(r => r.kind === 'connection') as ConnectionRelation[];
    const qConn = connections.find(c => c.endpoints[0] === 'q' && c.endpoints[1] === 'A');
    expect(qConn?.semantic).toBe('hangs-from');
    expect(qConn?.directed).toBe(true);
    const vConn = connections.find(c => c.endpoints[0] === 'B' && c.endpoints[1] === 'v');
    expect(vConn?.semantic).toBe('anchored-to');
  });

  it('connection ids are endpoint-based and unique', () => {
    const connections = spec.relations.filter(r => r.kind === 'connection') as ConnectionRelation[];
    const connIds = connections.map(c => c.id);
    expect(new Set(connIds).size).toBe(connIds.length);
    expect(connIds).toContain('connection-ceiling-q');
    expect(connIds).toContain('connection-p-b1');
  });

  it('extracts the three pulley system groupings with labels and correct members', () => {
    const groups = spec.relations.filter(r => r.kind === 'grouping') as GroupingRelation[];
    expect(groups).toHaveLength(3);

    const sysA = groups.find(g => g.id === 'sysA');
    expect(sysA?.members).toEqual(['A', 'p', 'r']);
    expect(sysA?.label).toBe('Pulley System A');

    const sysB = groups.find(g => g.id === 'sysB');
    expect(sysB?.members).toEqual(['r', 'B', 's']);
    expect(sysB?.label).toBe('Pulley System B');

    const sysC = groups.find(g => g.id === 'sysC');
    expect(sysC?.members).toEqual(['s', 'C', 'u']);
    expect(sysC?.label).toBe('Pulley System C');
  });
});

// === Integration test: flowchart ===

describe('flowchart integration test', () => {
  function flowchartSpec({ Rect, Arrow, StackV, Ref }: BluefishKit): unknown[] {
    return [
      Rect({ name: 'start' }),
      Rect({ name: 'process' }),
      Rect({ name: 'end' }),
      Arrow({}, [Ref({ select: 'start' }), Ref({ select: 'process' })]),
      Arrow({}, [Ref({ select: 'process' }), Ref({ select: 'end' })]),
      StackV({ spacing: 20 }, [Ref({ select: 'start' }), Ref({ select: 'process' }), Ref({ select: 'end' })]),
    ];
  }

  it('extracts Rect elements', () => {
    const spec = BluefishAdapter(flowchartSpec);
    const ids = spec.elements.map(e => e.id);
    expect(ids).toContain('start');
    expect(ids).toContain('process');
    expect(ids).toContain('end');
  });

  it('extracts directed Arrow connections', () => {
    const spec = BluefishAdapter(flowchartSpec);
    const connections = spec.relations.filter(r => r.kind === 'connection') as ConnectionRelation[];
    expect(connections).toHaveLength(2);
    expect(connections.every(c => c.directed === true)).toBe(true);
    expect(connections[0]?.endpoints).toEqual(['start', 'process']);
    expect(connections[1]?.endpoints).toEqual(['process', 'end']);
  });

  it('StackV layout is suppressed (no distribution relation)', () => {
    const spec = BluefishAdapter(flowchartSpec);
    expect(spec.relations.filter(r => r.kind === 'distribution')).toHaveLength(0);
  });

  it('produces no grouping relations', () => {
    const spec = BluefishAdapter(flowchartSpec);
    expect(spec.relations.filter(r => r.kind === 'grouping')).toHaveLength(0);
  });
});

// === Integration test: anchor-based pulley ===

const apr = 25;

function anchorPulleySpec({ Align, Circle, Distribute, Group, Line, Rect, Ref }: BluefishKit): unknown[] {
  function pulleyCircle(name: string, label: string) {
    return Align({ name, alignment: 'center', customData: { olli: { kind: 'pulley', label } } }, [
      Circle({ r: apr }),
      Circle({ name: `${name}-center`, r: 5, customData: { olli: { skip: true, alias: name } } }),
    ]);
  }
  function weightBox(name: string, label: string) {
    return Align({ name, alignment: 'center', customData: { olli: { kind: 'box', label } } }, [
      Rect({ width: 40, height: 40 }),
    ]);
  }
  return [
    Rect({ name: 'ceiling', customData: { olli: { label: 'Ceiling' } } }),
    Rect({ name: 'floor', customData: { olli: { label: 'Floor' } } }),
    pulleyCircle('A', 'Pulley A'),
    pulleyCircle('B', 'Pulley B'),
    pulleyCircle('C', 'Pulley C'),
    weightBox('b1', 'Box B1'),
    weightBox('b2', 'Box B2'),
    Circle({ name: 'ceil-A', r: 0.5, customData: { olli: { skip: true, alias: 'ceiling' } } }),
    Circle({ name: 'ceil-C', r: 0.5, customData: { olli: { skip: true, alias: 'ceiling' } } }),
    Circle({ name: 'floor-B', r: 0.5, customData: { olli: { skip: true, alias: 'floor' } } }),
    Line({ name: 'q', customData: { olli: { kind: 'rope', label: 'Rope q', semantic: 'hangs-from', directed: true } } }, [Ref({ select: 'A-center' }), Ref({ select: 'ceil-A' })]),
    Line({ name: 't', customData: { olli: { kind: 'rope', label: 'Rope t', semantic: 'hangs-from', directed: true } } }, [Ref({ select: 'C-center' }), Ref({ select: 'ceil-C' })]),
    Line({ name: 'p', customData: { olli: { kind: 'rope', label: 'Rope p', semantic: 'hangs-from', directed: true } } }, [Ref({ select: 'b1' }), Ref({ select: 'A-center' })]),
    Line({ name: 'r', customData: { olli: { kind: 'rope', label: 'Rope r' } } }, [Ref({ select: 'A-center' }), Ref({ select: 'B-center' })]),
    Line({ name: 's', customData: { olli: { kind: 'rope', label: 'Rope s' } } }, [Ref({ select: 'B-center' }), Ref({ select: 'C-center' })]),
    Line({ name: 'u', customData: { olli: { kind: 'rope', label: 'Rope u', semantic: 'hangs-from', directed: true } } }, [Ref({ select: 'b2' }), Ref({ select: 'C-center' })]),
    Line({ name: 'v', customData: { olli: { kind: 'rope', label: 'Rope v', semantic: 'anchored-to', directed: true } } }, [Ref({ select: 'B-center' }), Ref({ select: 'floor-B' })]),
    Group({ name: 'sysA', customData: { olli: { label: 'Pulley System A' } } }, [Ref({ select: 'A' }), Ref({ select: 'p' }), Ref({ select: 'r' })]),
    Group({ name: 'sysB', customData: { olli: { label: 'Pulley System B' } } }, [Ref({ select: 'r' }), Ref({ select: 'B' }), Ref({ select: 's' })]),
    Group({ name: 'sysC', customData: { olli: { label: 'Pulley System C' } } }, [Ref({ select: 's' }), Ref({ select: 'C' }), Ref({ select: 'u' })]),
  ];
}

describe('anchor-based pulley integration test', () => {
  let spec: DiagramSpec;

  beforeEach(() => {
    spec = BluefishAdapter(anchorPulleySpec);
  });

  it('produces exactly 8 connections with semantically correct endpoint ordering', () => {
    const connections = spec.relations.filter(r => r.kind === 'connection') as ConnectionRelation[];
    expect(connections).toHaveLength(8);
    const pairs = connections.map(c => c.endpoints);
    expect(pairs).toContainEqual(['A', 'q']);
    expect(pairs).toContainEqual(['q', 'ceiling']);
    expect(pairs).toContainEqual(['C', 't']);
    expect(pairs).toContainEqual(['t', 'ceiling']);
    expect(pairs).toContainEqual(['b1', 'p']);
    expect(pairs).toContainEqual(['b2', 'u']);
    expect(pairs).toContainEqual(['B', 'v']);
    expect(pairs).toContainEqual(['v', 'floor']);
  });

  it('anchor elements are not included in elements', () => {
    const ids = spec.elements.map(e => e.id);
    expect(ids).not.toContain('A-center');
    expect(ids).not.toContain('B-center');
    expect(ids).not.toContain('C-center');
    expect(ids).not.toContain('ceil-A');
    expect(ids).not.toContain('ceil-C');
    expect(ids).not.toContain('floor-B');
  });

  it('connections carry semantic and directed from customData after alias resolution', () => {
    const connections = spec.relations.filter(r => r.kind === 'connection') as ConnectionRelation[];
    const aqConn = connections.find(c => c.endpoints[0] === 'A' && c.endpoints[1] === 'q');
    expect(aqConn?.semantic).toBe('hangs-from');
    expect(aqConn?.directed).toBe(true);
    const bvConn = connections.find(c => c.endpoints[0] === 'B' && c.endpoints[1] === 'v');
    expect(bvConn?.semantic).toBe('anchored-to');
  });

  it('intra-group connections are suppressed after alias resolution', () => {
    const connections = spec.relations.filter(r => r.kind === 'connection') as ConnectionRelation[];
    const pairs = connections.map(c => c.endpoints);
    expect(pairs.some(([a, b]) => a === 'r' || b === 'r')).toBe(false);
    expect(pairs.some(([a, b]) => a === 's' || b === 's')).toBe(false);
    expect(pairs.some(([a, b]) => (a === 'A' && b === 'p') || (a === 'p' && b === 'A'))).toBe(false);
  });
});
