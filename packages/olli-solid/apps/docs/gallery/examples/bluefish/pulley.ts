import { BluefishAdapter } from 'olli-adapters';
import type { BluefishKit, BluefishSpecFn } from 'olli-adapters';
import type { DiagramExample } from '../types.js';

const r = 25;
const w2jut = 10;

const pulleySpec: BluefishSpecFn = ({ Align, Circle, Distribute, Group, Line, Path, Rect, Ref, StackH, Text }: BluefishKit) => {
  function pulleyCircle(name: string, label: string) {
    return Align({ name, alignment: 'center', customData: { olli: { kind: 'pulley', label } } }, [
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Text({ 'font-size': '10' as any, fill: 'white' }, label),
    ]);
  }

  function weightBox(name: string, olliLabel: string, ...children: unknown[]) {
    return StackH({ name, customData: { olli: { kind: 'box', label: olliLabel } } }, children);
  }

  return [
    Rect({ name: 'rect', height: 20, width: 9 * r, fill: '#C9C9C9', 'stroke-width': 2, customData: { olli: { label: 'Ceiling' } } }),

    pulleyCircle('A', 'Pulley A'),
    pulleyCircle('B', 'Pulley B'),
    pulleyCircle('C', 'Pulley C'),

    Distribute({ direction: 'horizontal', spacing: -r }, [
      Ref({ select: 'A' }),
      Ref({ select: 'B' }),
    ]),
    Distribute({ direction: 'horizontal', spacing: 0 }, [
      Ref({ select: 'B' }),
      Ref({ select: 'C' }),
    ]),
    Distribute({ direction: 'vertical', spacing: 40 }, [
      Ref({ select: 'rect' }),
      Ref({ select: 'B' }),
    ]),
    Distribute({ direction: 'vertical', spacing: 30 }, [
      Ref({ select: 'B' }),
      Ref({ select: 'A' }),
    ]),
    Distribute({ direction: 'vertical', spacing: 50 }, [
      Ref({ select: 'B' }),
      Ref({ select: 'C' }),
    ]),

    Align({ alignment: 'centerX' }, [Ref({ select: 'rect' }), Ref({ select: 'B' })]),

    Align({ alignment: 'center' }, [Ref({ select: 'B' }), Text({ x: r, y: -r, customData: { olli: { skip: true } } }, 'B')]),
    Align({ alignment: 'center' }, [Ref({ select: 'A' }), Text({ x: -r, y: -r, customData: { olli: { skip: true } } }, 'A')]),
    Align({ alignment: 'center' }, [Ref({ select: 'C' }), Text({ x: r, y: r, customData: { olli: { skip: true } } }, 'C')]),

    Line({ source: [0, 0.5], target: [0.5, 0.5], name: 'l1', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope x', semantic: 'hangs-from', directed: true } } }, [
      Ref({ select: 'B' }),
      Ref({ select: 'A' }),
    ]),
    Line({ source: [1, 0.5], target: [0, 0.5], name: 'l2', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope y', semantic: 'hangs-from', directed: true } } }, [
      Ref({ select: 'B' }),
      Ref({ select: 'C' }),
    ]),
    Line({ target: [1, 0.5], name: 'l3', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope z', semantic: 'anchored-to', directed: true } } }, [
      Ref({ select: 'rect' }),
      Ref({ select: 'C' }),
    ]),

    StackH({ spacing: 5 }, [Ref({ select: 'l1' }), Text({ name: 't1', customData: { olli: { skip: true } } }, 'x')]),
    Distribute({ spacing: 5, direction: 'horizontal' }, [
      Ref({ select: 'l2' }),
      Text({ name: 't2', customData: { olli: { skip: true } } }, 'y'),
    ]),
    Distribute({ spacing: 5, direction: 'horizontal' }, [
      Ref({ select: 'l3' }),
      Text({ name: 't3', customData: { olli: { skip: true } } }, 'z'),
    ]),
    Align({ alignment: 'centerY' }, [
      Ref({ select: 't1' }),
      Ref({ select: 't2' }),
      Ref({ select: 't3' }),
    ]),

    weightBox('w1', 'Box W1',
      weight(30, 30, 'W1'),
      Rect({ fill: 'transparent', width: r * 2 - 10 }),
    ),
    weightBox('w2', 'Box W2',
      Rect({ fill: 'transparent', width: r + (r / 2 - 10) - w2jut / 2 }),
      weight(r * 3 + w2jut, 30, 'W2'),
    ),
    Distribute({ spacing: 50, direction: 'vertical' }, [
      Ref({ select: 'C' }),
      Ref({ select: 'w2' }),
    ]),
    Align({ alignment: 'left' }, [Ref({ select: 'A' }), Ref({ select: 'w2' })]),
    Align({ alignment: 'centerX' }, [Ref({ select: 'A' }), Ref({ select: 'w1' })]),
    Align({ alignment: 'centerY' }, [Ref({ select: 'w1' }), Ref({ select: 'w2' })]),

    Line({ source: [0, 0.5], name: 'l4', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope p', semantic: 'hangs-from', directed: true } } }, [
      Ref({ select: 'A' }),
      Ref({ select: 'w1' }),
    ]),
    Line({ source: [1, 0.5], name: 'l5', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope q', semantic: 'hangs-from', directed: true } } }, [
      Ref({ select: 'A' }),
      Ref({ select: 'w2' }),
    ]),
    Line({ source: [0.5, 0.5], name: 'l6', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope s', semantic: 'hangs-from', directed: true } } }, [
      Ref({ select: 'C' }),
      Ref({ select: 'w2' }),
    ]),

    Distribute({ spacing: 5, direction: 'horizontal' }, [
      Ref({ select: 'l4' }),
      Text({ name: 't4', customData: { olli: { skip: true } } }, 'p'),
    ]),
    Distribute({ spacing: 5, direction: 'horizontal' }, [
      Ref({ select: 'l5' }),
      Text({ name: 't5', customData: { olli: { skip: true } } }, 'q'),
    ]),
    StackH({ spacing: 5 }, [Ref({ select: 'l6' }), Text({ name: 't6', customData: { olli: { skip: true } } }, 's')]),
    Align({ alignment: 'centerY' }, [
      Ref({ select: 't6' }),
      Ref({ select: 't5' }),
      Ref({ select: 't4' }),
    ]),

    Group({ name: 'sysB', customData: { olli: { label: 'Pulley System B' } } }, [
      Ref({ select: 'B' }),
      Ref({ select: 'l1' }),
      Ref({ select: 'l2' }),
    ]),
    Group({ name: 'sysA', customData: { olli: { label: 'Pulley System A' } } }, [
      Ref({ select: 'A' }),
      Ref({ select: 'l4' }),
      Ref({ select: 'l5' }),
    ]),
    Group({ name: 'sysC', customData: { olli: { label: 'Pulley System C' } } }, [
      Ref({ select: 'C' }),
      Ref({ select: 'l3' }),
      Ref({ select: 'l6' }),
    ]),

    // Overdraws to make diagram pretty
    pulleyCircle('Acopy', 'Pulley A'),
    pulleyCircle('Ccopy', 'Pulley C'),
    Align({ alignment: 'center' }, [Ref({ select: 'A' }), Ref({ select: 'Acopy' })]),
    Align({ alignment: 'center' }, [Ref({ select: 'C' }), Ref({ select: 'Ccopy' })]),
    Line({ source: [0, 0.5], target: [0.5, 0.5], name: 'l1copy', stroke: '#774e32' }, [
      Ref({ select: 'B' }),
      Ref({ select: 'A' }),
    ]),
    pulleyCircle('Bcopy', 'Pulley B'),
    Align({ alignment: 'center' }, [Ref({ select: 'B' }), Ref({ select: 'Bcopy' })]),
    Line({ target: [0.5, 0.5], name: 'l0', stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Axle rope', semantic: 'hangs-from', directed: true } } }, [
      Ref({ select: 'rect' }),
      Ref({ select: 'B' }),
    ]),
    Line({ source: [0.5, 0.5], name: 'l6copy', stroke: '#774e32' }, [
      Ref({ select: 'C' }),
      Ref({ select: 'w2' }),
    ]),
  ];
}

export const pulley: DiagramExample = {
  id: 'pulley',
  title: 'Pulley diagram',
  domain: 'diagram',
  toolkit: 'bluefish',
  tags: ['diagram', 'physics'],
  description: 'A compound pulley system with three pulleys, seven ropes, and two boxes.',
  spec: BluefishAdapter(pulleySpec),
  children: async () => pulleySpec(await import('bluefish-js') as unknown as BluefishKit),
};
