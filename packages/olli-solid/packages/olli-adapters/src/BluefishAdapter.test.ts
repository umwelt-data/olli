import { describe, it, expect, beforeEach } from 'vitest';
import { BluefishAdapter } from './BluefishAdapter.js';
import type { BluefishKit } from './BluefishAdapter.js';
import type { DiagramSpec, ConnectionRelation, AlignmentRelation, DistributionRelation, GroupingRelation } from 'olli-diagram';

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

// === Unit tests: relation extraction ===

describe('connection relations', () => {
  it('extracts named Line as element + connection', () => {
    const spec = BluefishAdapter(({ Rect, Line, Ref }) => [
      Rect({ name: 'a' }),
      Rect({ name: 'b' }),
      Line({ name: 'l1', stroke: 'black' }, [Ref({ select: 'a' }), Ref({ select: 'b' })]),
    ]);
    const conn = spec.relations.find(r => r.kind === 'connection') as ConnectionRelation;
    expect(conn).toBeDefined();
    expect(conn.id).toBe('connection-a-b');
    expect(conn.endpoints).toEqual(['a', 'b']);
    expect(conn.directed).toBeUndefined();
    expect(spec.elements.some(e => e.id === 'l1')).toBe(true);
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

describe('alignment relations', () => {
  it.each([
    ['center', 'both'],
    ['centerX', 'vertical'],
    ['left', 'vertical'],
    ['right', 'vertical'],
    ['centerY', 'horizontal'],
    ['top', 'horizontal'],
    ['bottom', 'horizontal'],
  ] as const)('alignment=%s → axis=%s', (alignment, expectedAxis) => {
    const spec = BluefishAdapter(({ Rect, Align, Ref }) => [
      Rect({ name: 'a' }),
      Rect({ name: 'b' }),
      Align({ alignment }, [Ref({ select: 'a' }), Ref({ select: 'b' })]),
    ]);
    const rel = spec.relations.find(r => r.kind === 'alignment') as AlignmentRelation;
    expect(rel).toBeDefined();
    expect(rel.axis).toBe(expectedAxis);
    expect(rel.members).toEqual(['a', 'b']);
  });

  it('generates auto id for unnamed Align', () => {
    const spec = BluefishAdapter(({ Rect, Align, Ref }) => [
      Rect({ name: 'x' }),
      Rect({ name: 'y' }),
      Align({ alignment: 'centerX' }, [Ref({ select: 'x' }), Ref({ select: 'y' })]),
    ]);
    const rel = spec.relations.find(r => r.kind === 'alignment') as AlignmentRelation;
    expect(rel.id).toBe('align-x-y');
  });
});

describe('distribution relations', () => {
  it('extracts Distribute with direction', () => {
    const spec = BluefishAdapter(({ Rect, Distribute, Ref }) => [
      Rect({ name: 'a' }),
      Rect({ name: 'b' }),
      Distribute({ direction: 'vertical', spacing: 10 }, [Ref({ select: 'a' }), Ref({ select: 'b' })]),
    ]);
    const rel = spec.relations.find(r => r.kind === 'distribution') as DistributionRelation;
    expect(rel).toBeDefined();
    expect(rel.direction).toBe('vertical');
    expect(rel.members).toEqual(['a', 'b']);
  });

  it('StackH produces horizontal distribution', () => {
    const spec = BluefishAdapter(({ Rect, StackH, Ref }) => [
      Rect({ name: 'a' }),
      Rect({ name: 'b' }),
      StackH({ spacing: 5 }, [Ref({ select: 'a' }), Ref({ select: 'b' })]),
    ]);
    const rel = spec.relations.find(r => r.kind === 'distribution') as DistributionRelation;
    expect(rel).toBeDefined();
    expect(rel.direction).toBe('horizontal');
  });

  it('StackV produces vertical distribution', () => {
    const spec = BluefishAdapter(({ Rect, StackV, Ref }) => [
      Rect({ name: 'a' }),
      Rect({ name: 'b' }),
      StackV({ spacing: 5 }, [Ref({ select: 'a' }), Ref({ select: 'b' })]),
    ]);
    const rel = spec.relations.find(r => r.kind === 'distribution') as DistributionRelation;
    expect(rel.direction).toBe('vertical');
  });
});

// === Unit tests: mixed children ===

describe('mixed children (Ref + inline)', () => {
  it('extracts named inline Text as element and adds as relation member', () => {
    const spec = BluefishAdapter(({ Rect, StackH, Ref, Text }) => [
      Rect({ name: 'l1' }),
      StackH({ spacing: 5 }, [Ref({ select: 'l1' }), Text({ name: 't1' }, 'x')]),
    ]);
    expect(spec.elements.some(e => e.id === 't1' && e.label === 'x')).toBe(true);
    const rel = spec.relations.find(r => r.kind === 'distribution') as DistributionRelation;
    expect(rel.members).toEqual(['l1', 't1']);
  });

  it('recurses into unnamed inline children for element extraction only', () => {
    const spec = BluefishAdapter(({ Align, Circle, Ref, Rect }) => [
      Rect({ name: 'anchor' }),
      Align({ alignment: 'center' }, [
        Ref({ select: 'anchor' }),
        Circle({ name: 'dot' }),
      ]),
    ]);
    expect(spec.elements.some(e => e.id === 'dot')).toBe(true);
    const rel = spec.relations.find(r => r.kind === 'alignment') as AlignmentRelation;
    expect(rel.members).toContain('anchor');
    expect(rel.members).toContain('dot');
  });

  it('skips copy members from relations', () => {
    const spec = BluefishAdapter(({ Rect, Align, Ref }) => [
      Rect({ name: 'a' }),
      Rect({ name: 'Acopy' }),
      Align({ alignment: 'center' }, [Ref({ select: 'a' }), Ref({ select: 'Acopy' })]),
    ]);
    // Only one non-copy member → no relation
    expect(spec.relations.filter(r => r.kind === 'alignment')).toHaveLength(0);
  });
});

// === Integration test: pulley ===

const r = 25;
const w2jut = 10;

function pulleySpec({ Align, Circle, Distribute, Group, Line, Path, Rect, Ref, StackH, Text }: BluefishKit): unknown[] {
  function pulleyCircle(name: string) {
    return Align({ name, alignment: 'center' }, [
      Circle({ r, stroke: '#828282', 'stroke-width': 3, fill: '#C1C1C1' }),
      Circle({ r: 5, fill: '#555555' }),
    ]);
  }

  function weight(width: number, height: number, label: string) {
    return Align({ alignment: 'center' }, [
      Path({
        d: `M 10,0 l ${width - 20},0 l 10,${height} l ${-width},0 Z`,
        fill: '#545454',
        stroke: '#545454',
      }),
      Text({ 'font-size': '10' }, label),
    ]);
  }

  return [
    Rect({ name: 'rect', height: 20, width: 9 * r, fill: '#C9C9C9', 'stroke-width': 2 }),

    pulleyCircle('A'),
    pulleyCircle('B'),
    pulleyCircle('C'),

    Distribute({ direction: 'horizontal', spacing: -r }, [Ref({ select: 'A' }), Ref({ select: 'B' })]),
    Distribute({ direction: 'horizontal', spacing: 0 }, [Ref({ select: 'B' }), Ref({ select: 'C' })]),
    Distribute({ direction: 'vertical', spacing: 40 }, [Ref({ select: 'rect' }), Ref({ select: 'B' })]),
    Distribute({ direction: 'vertical', spacing: 30 }, [Ref({ select: 'B' }), Ref({ select: 'A' })]),
    Distribute({ direction: 'vertical', spacing: 50 }, [Ref({ select: 'B' }), Ref({ select: 'C' })]),

    Group({ name: 'G' }, [Ref({ select: 'A' }), Ref({ select: 'B' }), Ref({ select: 'C' })]),
    Align({ alignment: 'centerX' }, [Ref({ select: 'rect' }), Ref({ select: 'G' })]),

    Align({ alignment: 'center' }, [Ref({ select: 'B' }), Text({ x: r, y: -r }, 'B')]),
    Align({ alignment: 'center' }, [Ref({ select: 'A' }), Text({ x: -r, y: -r }, 'A')]),
    Align({ alignment: 'center' }, [Ref({ select: 'C' }), Text({ x: r, y: r }, 'C')]),

    Line({ source: [0, 0.5], target: [0.5, 0.5], name: 'l1', stroke: '#774e32' }, [Ref({ select: 'B' }), Ref({ select: 'A' })]),
    Line({ source: [1, 0.5], target: [0, 0.5], name: 'l2', stroke: '#774e32' }, [Ref({ select: 'B' }), Ref({ select: 'C' })]),
    Line({ target: [1, 0.5], name: 'l3', stroke: '#774e32' }, [Ref({ select: 'rect' }), Ref({ select: 'C' })]),

    StackH({ spacing: 5 }, [Ref({ select: 'l1' }), Text({ name: 't1' }, 'x')]),
    Distribute({ spacing: 5, direction: 'horizontal' }, [Ref({ select: 'l2' }), Text({ name: 't2' }, 'y')]),
    Distribute({ spacing: 5, direction: 'horizontal' }, [Ref({ select: 'l3' }), Text({ name: 't3' }, 'z')]),
    Align({ alignment: 'centerY' }, [Ref({ select: 't1' }), Ref({ select: 't2' }), Ref({ select: 't3' })]),

    StackH({ name: 'w1' }, [
      weight(30, 30, 'W1'),
      Rect({ fill: 'transparent', width: r * 2 - 10 }),
    ]),
    StackH({ name: 'w2' }, [
      Rect({ fill: 'transparent', width: r + (r / 2 - 10) - w2jut / 2 }),
      weight(r * 3 + w2jut, 30, 'W2'),
    ]),
    Distribute({ spacing: 50, direction: 'vertical' }, [Ref({ select: 'C' }), Ref({ select: 'w2' })]),
    Align({ alignment: 'left' }, [Ref({ select: 'A' }), Ref({ select: 'w2' })]),
    Align({ alignment: 'centerX' }, [Ref({ select: 'A' }), Ref({ select: 'w1' })]),
    Align({ alignment: 'centerY' }, [Ref({ select: 'w1' }), Ref({ select: 'w2' })]),

    Line({ source: [0, 0.5], name: 'l4', stroke: '#774e32' }, [Ref({ select: 'A' }), Ref({ select: 'w1' })]),
    Line({ source: [1, 0.5], name: 'l5', stroke: '#774e32' }, [Ref({ select: 'A' }), Ref({ select: 'w2' })]),
    Line({ source: [0.5, 0.5], name: 'l6', stroke: '#774e32' }, [Ref({ select: 'C' }), Ref({ select: 'w2' })]),

    Distribute({ spacing: 5, direction: 'horizontal' }, [Ref({ select: 'l4' }), Text({ name: 't4' }, 'p')]),
    Distribute({ spacing: 5, direction: 'horizontal' }, [Ref({ select: 'l5' }), Text({ name: 't5' }, 'q')]),
    StackH({ spacing: 5 }, [Ref({ select: 'l6' }), Text({ name: 't6' }, 's')]),
    Align({ alignment: 'centerY' }, [Ref({ select: 't6' }), Ref({ select: 't5' }), Ref({ select: 't4' })]),

    // Overdraws (copy elements and their alignment/copy lines should be filtered)
    pulleyCircle('Acopy'),
    pulleyCircle('Ccopy'),
    Align({ alignment: 'center' }, [Ref({ select: 'A' }), Ref({ select: 'Acopy' })]),
    Align({ alignment: 'center' }, [Ref({ select: 'C' }), Ref({ select: 'Ccopy' })]),
    Line({ source: [0, 0.5], target: [0.5, 0.5], name: 'l1copy', stroke: '#774e32' }, [Ref({ select: 'B' }), Ref({ select: 'A' })]),
    pulleyCircle('Bcopy'),
    Align({ alignment: 'center' }, [Ref({ select: 'B' }), Ref({ select: 'Bcopy' })]),
    Line({ target: [0.5, 0.5], name: 'l0', stroke: '#774e32' }, [Ref({ select: 'rect' }), Ref({ select: 'B' })]),
    Line({ source: [0.5, 0.5], name: 'l6copy', stroke: '#774e32' }, [Ref({ select: 'C' }), Ref({ select: 'w2' })]),
  ];
}

describe('pulley integration test', () => {
  let spec: DiagramSpec;

  beforeEach(() => {
    spec = BluefishAdapter(pulleySpec);
  });

  it('extracts the correct structural elements', () => {
    const ids = spec.elements.map(e => e.id);
    expect(ids).toContain('rect');
    expect(ids).toContain('A');
    expect(ids).toContain('B');
    expect(ids).toContain('C');
    expect(ids).toContain('l0');
    expect(ids).toContain('l1');
    expect(ids).toContain('l2');
    expect(ids).toContain('l3');
    expect(ids).toContain('l4');
    expect(ids).toContain('l5');
    expect(ids).toContain('l6');
    expect(ids).toContain('w1');
    expect(ids).toContain('w2');
    expect(ids).toContain('t1');
    expect(ids).toContain('t2');
    expect(ids).toContain('t3');
    expect(ids).toContain('t4');
    expect(ids).toContain('t5');
    expect(ids).toContain('t6');
  });

  it('does not include copy elements', () => {
    const ids = spec.elements.map(e => e.id);
    expect(ids).not.toContain('Acopy');
    expect(ids).not.toContain('Bcopy');
    expect(ids).not.toContain('Ccopy');
    expect(ids).not.toContain('l1copy');
    expect(ids).not.toContain('l6copy');
  });

  it('extracts text element labels correctly', () => {
    const t1 = spec.elements.find(e => e.id === 't1');
    expect(t1?.label).toBe('x');
    const t4 = spec.elements.find(e => e.id === 't4');
    expect(t4?.label).toBe('p');
  });

  it('extracts connections for all named Lines (7 non-copy lines)', () => {
    const connections = spec.relations.filter(r => r.kind === 'connection') as ConnectionRelation[];
    // l0–l6 each produce one connection; l1copy and l6copy are filtered
    expect(connections).toHaveLength(7);
    const endpointPairs = connections.map(c => c.endpoints);
    expect(endpointPairs).toContainEqual(['rect', 'B']); // l0
    expect(endpointPairs).toContainEqual(['B', 'A']);     // l1
    expect(endpointPairs).toContainEqual(['B', 'C']);     // l2
    expect(endpointPairs).toContainEqual(['rect', 'C']); // l3
    expect(endpointPairs).toContainEqual(['A', 'w1']);   // l4
    expect(endpointPairs).toContainEqual(['A', 'w2']);   // l5
    expect(endpointPairs).toContainEqual(['C', 'w2']);   // l6
  });

  it('connection ids are endpoint-based and unique', () => {
    const connections = spec.relations.filter(r => r.kind === 'connection') as ConnectionRelation[];
    const connIds = connections.map(c => c.id);
    expect(new Set(connIds).size).toBe(connIds.length);
    expect(connIds).toContain('connection-B-A');
    expect(connIds).toContain('connection-A-w1');
  });

  it('extracts the G grouping relation', () => {
    const groups = spec.relations.filter(r => r.kind === 'grouping') as GroupingRelation[];
    const G = groups.find(g => g.id === 'G');
    expect(G).toBeDefined();
    expect(G?.members).toEqual(['A', 'B', 'C']);
  });

  it('extracts distribution relations', () => {
    const dists = spec.relations.filter(r => r.kind === 'distribution') as DistributionRelation[];
    expect(dists.length).toBeGreaterThan(0);
    const horizAB = dists.find(d => d.members.includes('A') && d.members.includes('B') && d.direction === 'horizontal');
    expect(horizAB).toBeDefined();
  });

  it('extracts alignment relations with correct axes', () => {
    const aligns = spec.relations.filter(r => r.kind === 'alignment') as AlignmentRelation[];
    // Align({ alignment: 'centerX' }, [Ref('A'), Ref('w1')]) → axis='vertical'
    const centerXAlign = aligns.find(a => a.members.includes('A') && a.members.includes('w1'));
    expect(centerXAlign?.axis).toBe('vertical');
    // Align({ alignment: 'centerY' }, [Ref('w1'), Ref('w2')]) → axis='horizontal'
    const centerYAlign = aligns.find(a => a.members.includes('w1') && a.members.includes('w2'));
    expect(centerYAlign?.axis).toBe('horizontal');
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
    expect(connections[0].endpoints).toEqual(['start', 'process']);
    expect(connections[1].endpoints).toEqual(['process', 'end']);
  });

  it('extracts vertical StackV distribution', () => {
    const spec = BluefishAdapter(flowchartSpec);
    const dists = spec.relations.filter(r => r.kind === 'distribution') as DistributionRelation[];
    expect(dists).toHaveLength(1);
    expect(dists[0].direction).toBe('vertical');
    expect(dists[0].members).toEqual(['start', 'process', 'end']);
  });

  it('produces no grouping relations', () => {
    const spec = BluefishAdapter(flowchartSpec);
    expect(spec.relations.filter(r => r.kind === 'grouping')).toHaveLength(0);
  });
});
