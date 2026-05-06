import { BluefishAdapter } from 'olli-adapters';
import type { BluefishKit, BluefishSpecFn } from 'olli-adapters';
import type { DiagramExample } from '../types.js';

const r = 25;

const pulleySpec: BluefishSpecFn = ({ Align, Circle, Distribute, Group, Line, Rect, Ref, Text }: BluefishKit) => {
  function pulleyCircle(name: string, label: string) {
    return Align({ name, alignment: 'center', customData: { olli: { kind: 'pulley', label } } }, [
      Circle({ r, stroke: '#828282', 'stroke-width': 3, fill: '#C1C1C1' }),
      Circle({ r: 5, fill: '#555555', customData: { olli: { skip: true } } }),
    ]);
  }

  /** Cosmetic-only full pulley circle (name must end in 'copy'). */
  function pulleyCircleCopy(name: string) {
    return Align({ name, alignment: 'center' }, [
      Circle({ r, stroke: '#828282', 'stroke-width': 3, fill: '#C1C1C1' }),
      Circle({ r: 5, fill: '#555555' }),
    ]);
  }

  /** Cosmetic-only pulley center dot (name must end in 'copy'). */
  function pulleyDotCopy(name: string) {
    return Circle({ name, r: 5, fill: '#555555' });
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

    // Layout positioning
    Distribute({ direction: 'horizontal', spacing: 0 }, [Ref({ select: 'A' }), Ref({ select: 'B' })]),
    Distribute({ direction: 'horizontal', spacing: 0 }, [Ref({ select: 'B' }), Ref({ select: 'C' })]),
    Distribute({ direction: 'vertical', spacing: 60 }, [Ref({ select: 'ceiling' }), Ref({ select: 'A' })]),
    Distribute({ direction: 'vertical', spacing: 60 }, [Ref({ select: 'ceiling' }), Ref({ select: 'C' })]),
    Distribute({ direction: 'vertical', spacing: 50 }, [Ref({ select: 'A' }), Ref({ select: 'B' })]),
    Align({ alignment: 'top' }, [Ref({ select: 'B' }), Ref({ select: 'b1' }), Ref({ select: 'b2' })]),
    Distribute({ direction: 'vertical', spacing: 60 }, [Ref({ select: 'B' }), Ref({ select: 'floor' })]),
    Align({ alignment: 'centerX' }, [Ref({ select: 'ceiling' }), Ref({ select: 'B' })]),
    Distribute({ direction: 'horizontal', spacing: -20 }, [Ref({ select: 'b1' }), Ref({ select: 'A' })]),
    Distribute({ direction: 'horizontal', spacing: -20 }, [Ref({ select: 'C' }), Ref({ select: 'b2' })]),
    Align({ alignment: 'centerX' }, [Ref({ select: 'B' }), Ref({ select: 'floor' })]),

    // Pulley labels (skipped from olli tree)
    Align({ alignment: 'center' }, [Ref({ select: 'A' }), Text({ x: -r, y: -r, customData: { olli: { skip: true } } }, 'A')]),
    Align({ alignment: 'center' }, [Ref({ select: 'B' }), Text({ x: r, y: r, customData: { olli: { skip: true } } }, 'B')]),
    Align({ alignment: 'center' }, [Ref({ select: 'C' }), Text({ x: r, y: -r, customData: { olli: { skip: true } } }, 'C')]),

    // ================================================================
    // ROPES — split into two groups for visual layering.
    //
    // Ropes p, r, s, u connect to pulley sides and must render UNDER
    // the pulley circles (covered by overdraw Layer 1 below).
    //
    // Ropes q, t, v are the "hanging" / "anchoring" ropes and must
    // render ABOVE pulley circles but under the center dots (placed
    // after overdraw Layer 1, before overdraw Layer 2).
    //
    // The olli adapter extracts elements by name regardless of
    // declaration order, so this reordering is purely cosmetic.
    // ================================================================

    // Ropes: Ref ordering determines semantic direction (ep0 {semantic} rope, rope {semantic} ep1)
    // --- Under pulleys: p, r, s, u ---
    // p: Box B1 hangs from Rope p; (p→A suppressed, both in sysA)
    Line({ name: 'p', source: [0.5, 0], target: [0, 0.5], stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope p', semantic: 'hangs-from', directed: true } } }, [
      Ref({ select: 'b1' }), Ref({ select: 'A' }),
    ]),
    // r: A→B both suppressed (sysA and sysB)
    Line({ name: 'r', source: [1, 0.5], target: [0, 0.5], stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope r' } } }, [
      Ref({ select: 'A' }), Ref({ select: 'B' }),
    ]),
    // s: B→C both suppressed (sysB and sysC)
    Line({ name: 's', source: [1, 0.5], target: [0, 0.5], stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope s' } } }, [
      Ref({ select: 'B' }), Ref({ select: 'C' }),
    ]),
    // u: Box B2 hangs from Rope u; (u→C suppressed, both in sysC)
    Line({ name: 'u', source: [0.5, 0], target: [1, 0.5], stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope u', semantic: 'hangs-from', directed: true } } }, [
      Ref({ select: 'b2' }), Ref({ select: 'C' }),
    ]),

    // Rope labels for p, r, s, u
    Text({ name: 'p-label', customData: { olli: { skip: true } } }, 'p'),
    Distribute({ direction: 'horizontal', spacing: 3 }, [Ref({ select: 'p-label' }), Ref({ select: 'p' })]),

    Text({ name: 'r-label', customData: { olli: { skip: true } } }, 'r'),
    Distribute({ direction: 'horizontal', spacing: 3 }, [Ref({ select: 'r' }), Ref({ select: 'r-label' })]),

    Text({ name: 's-label', customData: { olli: { skip: true } } }, 's'),
    Distribute({ direction: 'horizontal', spacing: 3 }, [Ref({ select: 's-label' }), Ref({ select: 's' })]),

    Text({ name: 'u-label', customData: { olli: { skip: true } } }, 'u'),
    Distribute({ direction: 'horizontal', spacing: 3 }, [Ref({ select: 'u' }), Ref({ select: 'u-label' })]),
    Align({ alignment: 'centerY' }, [Ref({ select: 'r' }), Ref({ select: 'p-label' }), Ref({ select: 'r-label' }), Ref({ select: 's-label' }), Ref({ select: 'u-label' })]),

    // ============================================================
    // COSMETIC OVERDRAWS — visual layering only, no semantic effect.
    // Elements named *copy are excluded from the olli accessibility
    // tree (see isCopyName in BluefishAdapter.ts).
    //
    // Desired visual layering (bottom to top):
    //   1. Ropes p, r, s, u (structural, declared above)
    //   2. Pulley circles (Layer 1 overdraw)
    //   3. Ropes q, t, v (structural, declared below)
    //   4. Pulley inner dots (Layer 2 overdraw)
    // ============================================================

    // Layer 1: Pulley circles cover ropes p, r, s, u
    pulleyCircleCopy('Acopy'),
    Align({ alignment: 'center' }, [Ref({ select: 'A' }), Ref({ select: 'Acopy' })]),
    pulleyCircleCopy('Bcopy'),
    Align({ alignment: 'center' }, [Ref({ select: 'B' }), Ref({ select: 'Bcopy' })]),
    pulleyCircleCopy('Ccopy'),
    Align({ alignment: 'center' }, [Ref({ select: 'C' }), Ref({ select: 'Ccopy' })]),

    // --- Above pulleys: q, t, v ---
    // q: Pulley A hangs from Rope q; Rope q hangs from Ceiling
    Line({ name: 'q', source: [0.5, 0.5], stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope q', semantic: 'hangs-from', directed: true } } }, [
      Ref({ select: 'A' }), Ref({ select: 'ceiling' }),
    ]),
    // t: Pulley C hangs from Rope t; Rope t hangs from Ceiling
    Line({ name: 't', source: [0.5, 0.5], stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope t', semantic: 'hangs-from', directed: true } } }, [
      Ref({ select: 'C' }), Ref({ select: 'ceiling' }),
    ]),
    // v: Pulley B anchored to Rope v; Rope v anchored to Floor
    Line({ name: 'v', source: [0.5, 0.5], stroke: '#774e32', customData: { olli: { kind: 'rope', label: 'Rope v', semantic: 'anchored-to', directed: true } } }, [
      Ref({ select: 'B' }), Ref({ select: 'floor' }),
    ]),

    // Rope labels for q, t, v
    Text({ name: 'q-label', customData: { olli: { skip: true } } }, 'q'),
    Distribute({ direction: 'horizontal', spacing: 3 }, [Ref({ select: 'q' }), Ref({ select: 'q-label' })]),
    Distribute({ direction: 'vertical', spacing: 20 }, [Ref({ select: 'ceiling' }), Ref({ select: 'q-label' })]),

    Text({ name: 't-label', customData: { olli: { skip: true } } }, 't'),
    Distribute({ direction: 'horizontal', spacing: 3 }, [Ref({ select: 't-label' }), Ref({ select: 't' })]),
    Align({ alignment: 'centerY' }, [Ref({ select: 'q-label' }), Ref({ select: 't-label' })]),

    Text({ name: 'v-label', customData: { olli: { skip: true } } }, 'v'),
    Distribute({ direction: 'horizontal', spacing: 3 }, [Ref({ select: 'v-label' }), Ref({ select: 'v' })]),
    Distribute({ direction: 'vertical', spacing: 20 }, [Ref({ select: 'B' }), Ref({ select: 'v-label' })]),

    // Layer 2: Pulley center dots above ropes q, t, v
    pulleyDotCopy('Adot-copy'),
    Align({ alignment: 'center' }, [Ref({ select: 'A' }), Ref({ select: 'Adot-copy' })]),
    pulleyDotCopy('Bdot-copy'),
    Align({ alignment: 'center' }, [Ref({ select: 'B' }), Ref({ select: 'Bdot-copy' })]),
    pulleyDotCopy('Cdot-copy'),
    Align({ alignment: 'center' }, [Ref({ select: 'C' }), Ref({ select: 'Cdot-copy' })]),

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
