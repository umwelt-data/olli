import { BluefishAdapter } from 'olli-adapters';
import type { BluefishKit, BluefishSpecFn } from 'olli-adapters';
import type { DiagramExample } from '../types.js';

const r = 25;

const pulleySpec: BluefishSpecFn = ({ Align, Circle, Distribute, Group, Line, Rect, Ref, Text }: BluefishKit) => {
  function pulleyCircle(name: string, label: string) {
    return Align({ name, alignment: 'center', customData: { olli: { kind: 'pulley', label } } }, [
      Circle({ r, stroke: '#828282', 'stroke-width': 3, fill: '#C1C1C1' }),
      Circle({ name: `${name}-center`, r: 5, fill: '#555555', customData: { olli: { skip: true, alias: name } } }),
    ]);
  }

  function weightBox(name: string, olliLabel: string, wlabel: string) {
    return Align({ name, alignment: 'center', customData: { olli: { kind: 'box', label: olliLabel } } }, [
      Rect({ width: 40, height: 40, fill: '#545454', stroke: '#545454' }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Text({ 'font-size': '10' as any, fill: 'white', customData: { olli: { skip: true } } }, wlabel),
    ]);
  }

  return [
    Rect({ name: 'ceiling', height: 20, width: 14 * r, fill: '#C9C9C9', 'stroke-width': 2, customData: { olli: { label: 'Ceiling' } } }),
    Rect({ name: 'floor', height: 20, width: 14 * r, fill: '#C9C9C9', 'stroke-width': 2, customData: { olli: { label: 'Floor' } } }),

    pulleyCircle('A', 'Pulley A'),
    pulleyCircle('B', 'Pulley B'),
    pulleyCircle('C', 'Pulley C'),
    weightBox('b1', 'Box B1', 'B1'),
    weightBox('b2', 'Box B2', 'B2'),

    // Ceiling/floor anchor points (skip: invisible, alias: resolves to ceiling/floor in connections)
    Circle({ name: 'ceil-A', r: 0.5, fill: 'none', stroke: 'none', customData: { olli: { skip: true, alias: 'ceiling' } } }),
    Circle({ name: 'ceil-C', r: 0.5, fill: 'none', stroke: 'none', customData: { olli: { skip: true, alias: 'ceiling' } } }),
    Circle({ name: 'floor-B', r: 0.5, fill: 'none', stroke: 'none', customData: { olli: { skip: true, alias: 'floor' } } }),

    // Layout positioning
    Distribute({ direction: 'horizontal', spacing: 4 * r }, [Ref({ select: 'A' }), Ref({ select: 'C' })]),
    Distribute({ direction: 'horizontal', spacing: r }, [Ref({ select: 'A' }), Ref({ select: 'B' })]),
    Distribute({ direction: 'vertical', spacing: 60 }, [Ref({ select: 'ceiling' }), Ref({ select: 'A' })]),
    Distribute({ direction: 'vertical', spacing: 60 }, [Ref({ select: 'ceiling' }), Ref({ select: 'C' })]),
    Distribute({ direction: 'vertical', spacing: 50 }, [Ref({ select: 'A' }), Ref({ select: 'B' })]),
    Distribute({ direction: 'vertical', spacing: 80 }, [Ref({ select: 'A' }), Ref({ select: 'b1' })]),
    Distribute({ direction: 'vertical', spacing: 80 }, [Ref({ select: 'C' }), Ref({ select: 'b2' })]),
    Distribute({ direction: 'vertical', spacing: 60 }, [Ref({ select: 'B' }), Ref({ select: 'floor' })]),
    Align({ alignment: 'centerX' }, [Ref({ select: 'ceiling' }), Ref({ select: 'B' })]),
    Align({ alignment: 'centerX' }, [Ref({ select: 'A' }), Ref({ select: 'b1' })]),
    Align({ alignment: 'centerX' }, [Ref({ select: 'C' }), Ref({ select: 'b2' })]),
    Align({ alignment: 'centerX' }, [Ref({ select: 'B' }), Ref({ select: 'floor' })]),

    // Position ceiling/floor anchors
    Align({ alignment: 'centerX' }, [Ref({ select: 'A' }), Ref({ select: 'ceil-A' })]),
    Align({ alignment: 'centerY' }, [Ref({ select: 'ceiling' }), Ref({ select: 'ceil-A' })]),
    Align({ alignment: 'centerX' }, [Ref({ select: 'C' }), Ref({ select: 'ceil-C' })]),
    Align({ alignment: 'centerY' }, [Ref({ select: 'ceiling' }), Ref({ select: 'ceil-C' })]),
    Align({ alignment: 'centerX' }, [Ref({ select: 'B' }), Ref({ select: 'floor-B' })]),
    Align({ alignment: 'centerY' }, [Ref({ select: 'floor' }), Ref({ select: 'floor-B' })]),

    // Pulley labels (skipped from olli tree)
    Align({ alignment: 'center' }, [Ref({ select: 'A' }), Text({ x: -r, y: -r, customData: { olli: { skip: true } } }, 'A')]),
    Align({ alignment: 'center' }, [Ref({ select: 'B' }), Text({ x: r, y: -r, customData: { olli: { skip: true } } }, 'B')]),
    Align({ alignment: 'center' }, [Ref({ select: 'C' }), Text({ x: r, y: r, customData: { olli: { skip: true } } }, 'C')]),

    // Ropes: Ref ordering determines semantic direction (ep0 {semantic} rope, rope {semantic} ep1)
    // q: Pulley A hangs from Rope q; Rope q hangs from Ceiling
    Line({ name: 'q', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope q', semantic: 'hangs-from', directed: true } } }, [
      Ref({ select: 'A-center' }), Ref({ select: 'ceil-A' }),
    ]),
    // t: Pulley C hangs from Rope t; Rope t hangs from Ceiling
    Line({ name: 't', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope t', semantic: 'hangs-from', directed: true } } }, [
      Ref({ select: 'C-center' }), Ref({ select: 'ceil-C' }),
    ]),
    // p: Box B1 hangs from Rope p; (p→A suppressed, both in sysA)
    Line({ name: 'p', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope p', semantic: 'hangs-from', directed: true } } }, [
      Ref({ select: 'b1' }), Ref({ select: 'A-center' }),
    ]),
    // r: A→B both suppressed (sysA and sysB)
    Line({ name: 'r', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope r' } } }, [
      Ref({ select: 'A-center' }), Ref({ select: 'B-center' }),
    ]),
    // s: B→C both suppressed (sysB and sysC)
    Line({ name: 's', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope s' } } }, [
      Ref({ select: 'B-center' }), Ref({ select: 'C-center' }),
    ]),
    // u: Box B2 hangs from Rope u; (u→C suppressed, both in sysC)
    Line({ name: 'u', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope u', semantic: 'hangs-from', directed: true } } }, [
      Ref({ select: 'b2' }), Ref({ select: 'C-center' }),
    ]),
    // v: Pulley B anchored to Rope v; Rope v anchored to Floor
    Line({ name: 'v', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope v', semantic: 'anchored-to', directed: true } } }, [
      Ref({ select: 'B-center' }), Ref({ select: 'floor-B' }),
    ]),

    // Pulley systems
    Group({ name: 'sysA', customData: { olli: { label: 'Pulley System A' } } }, [
      Ref({ select: 'A' }), Ref({ select: 'p' }), Ref({ select: 'r' }),
    ]),
    Group({ name: 'sysB', customData: { olli: { label: 'Pulley System B' } } }, [
      Ref({ select: 'r' }), Ref({ select: 'B' }), Ref({ select: 's' }),
    ]),
    Group({ name: 'sysC', customData: { olli: { label: 'Pulley System C' } } }, [
      Ref({ select: 's' }), Ref({ select: 'C' }), Ref({ select: 'u' }),
    ]),
  ];
};

export const pulley: DiagramExample = {
  id: 'pulley',
  title: 'Pulley diagram',
  domain: 'diagram',
  toolkit: 'bluefish',
  tags: ['diagram', 'physics'],
  description: 'A mechanical system consisting of pulleys, ropes, and boxes.',
  spec: BluefishAdapter(pulleySpec),
  children: async () => pulleySpec(await import('bluefish-js') as unknown as BluefishKit),
};
