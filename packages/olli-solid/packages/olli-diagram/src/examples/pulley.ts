import type { DiagramSpec } from '../spec/types.js';

/**
 * Compound pulley system from the Bluefish example gallery (pulley.tsx).
 *
 * Element IDs are Bluefish scenegraph names. Rope labels come from the
 * Bluefish text annotations (l1→"x", l2→"y", l3→"z", l4→"p", l5→"q",
 * l6→"s"). l0 has no text label in the Bluefish source.
 *
 * Physical topology (from Bluefish connections):
 *   - Pulley B is at the top, suspended from the Ceiling via l0.
 *   - Rope x (l1) wraps left of B down to Pulley A.
 *   - Rope y (l2) wraps right of B across to Pulley C.
 *   - Rope z (l3) runs from the Ceiling to the right of Pulley C.
 *   - Rope p (l4) wraps left of A down to Box W1.
 *   - Rope q (l5) wraps right of A down to Box W2.
 *   - Rope s (l6) runs from Pulley C down to Box W2.
 */
export const pulleySpec: DiagramSpec = {
  title: 'Pulley diagram',
  description:
    'A compound pulley system with three pulleys, seven ropes, and two boxes.',
  elements: [
    { id: 'rect', label: 'Ceiling' },
    { id: 'B', label: 'Pulley B', kind: 'pulley' },
    { id: 'A', label: 'Pulley A', kind: 'pulley' },
    { id: 'C', label: 'Pulley C', kind: 'pulley' },
    { id: 'l0', label: 'Axle rope', kind: 'rope' },
    { id: 'l1', label: 'Rope x', kind: 'rope' },
    { id: 'l2', label: 'Rope y', kind: 'rope' },
    { id: 'l3', label: 'Rope z', kind: 'rope' },
    { id: 'l4', label: 'Rope p', kind: 'rope' },
    { id: 'l5', label: 'Rope q', kind: 'rope' },
    { id: 'l6', label: 'Rope s', kind: 'rope' },
    { id: 'w1', label: 'Box W1', kind: 'box' },
    { id: 'w2', label: 'Box W2', kind: 'box' },
  ],
  relations: [
    // Pulley system groupings (each pulley + its wrapping rope segments)
    {
      kind: 'grouping',
      id: 'sysB',
      members: ['B', 'l1', 'l2'],
      label: 'Pulley System B',
    },
    {
      kind: 'grouping',
      id: 'sysA',
      members: ['A', 'l4', 'l5'],
      label: 'Pulley System A',
    },
    {
      kind: 'grouping',
      id: 'sysC',
      members: ['C', 'l3', 'l6'],
      label: 'Pulley System C',
    },

    // Suspension: Pulley B hangs from Ceiling via axle rope
    {
      kind: 'connection',
      id: 'h-B-l0',
      endpoints: ['B', 'l0'],
      directed: true,
      semantic: 'hangs-from',
      label: 'Pulley B hangs from Axle rope',
    },
    {
      kind: 'connection',
      id: 'h-l0-rect',
      endpoints: ['l0', 'rect'],
      directed: true,
      semantic: 'hangs-from',
      label: 'Axle rope hangs from Ceiling',
    },

    // Pulleys hanging from ropes through Pulley System B
    {
      kind: 'connection',
      id: 'h-A-l1',
      endpoints: ['A', 'l1'],
      directed: true,
      semantic: 'hangs-from',
      label: 'Pulley A hangs from Rope x',
    },
    {
      kind: 'connection',
      id: 'h-C-l2',
      endpoints: ['C', 'l2'],
      directed: true,
      semantic: 'hangs-from',
      label: 'Pulley C hangs from Rope y',
    },

    // Rope z anchored to Ceiling
    {
      kind: 'connection',
      id: 'a-l3-rect',
      endpoints: ['l3', 'rect'],
      directed: true,
      semantic: 'anchored-to',
      label: 'Rope z is anchored to Ceiling',
    },

    // Boxes hanging from ropes
    {
      kind: 'connection',
      id: 'h-w1-l4',
      endpoints: ['w1', 'l4'],
      directed: true,
      semantic: 'hangs-from',
      label: 'Box W1 hangs from Rope p',
    },
    {
      kind: 'connection',
      id: 'h-w2-l5',
      endpoints: ['w2', 'l5'],
      directed: true,
      semantic: 'hangs-from',
      label: 'Box W2 hangs from Rope q',
    },
    {
      kind: 'connection',
      id: 'h-w2-l6',
      endpoints: ['w2', 'l6'],
      directed: true,
      semantic: 'hangs-from',
      label: 'Box W2 hangs from Rope s',
    },
  ],
};
