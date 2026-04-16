import { createRoot } from 'solid-js';
import { describe, expect, it } from 'vitest';
import { buildHypergraph } from '../hypergraph/build.js';
import type { Hyperedge } from '../hypergraph/types.js';
import { createNavigationRuntime } from './runtime.js';
import { VIRTUAL_SUFFIX } from './navtree.js';

// Scaled-down pulley subset: root + Pulley System A (1) + Rope q (12) +
// "Box B1 hangs from Rope q" (18) + Box B1 (4) [two parents: 0 and 18].
// Mirrors the Phase-4 trace-B ascent through a multi-parent node.
function pulleySubset() {
  const edge = (
    id: string,
    displayName: string,
    children: string[],
    parents: string[],
  ): Hyperedge => ({ id, displayName, children, parents });
  return buildHypergraph([
    edge('0', 'Pulley diagram', ['1', '18', '4'], []),
    edge('1', 'Pulley System A', ['12'], ['0']),
    edge('12', 'Rope q', [], ['1']),
    edge('18', 'Box B1 hangs from Rope q', ['4'], ['0']),
    edge('4', 'Box B1', [], ['0', '18']),
  ]);
}

describe('Phase 1 acceptance: programmatic Trace-B-like ascent', () => {
  it('reaches Box B1 via hangs-edge then produces virtual parent-context on Up', () => {
    createRoot((dispose) => {
      const rt = createNavigationRuntime(pulleySubset());
      expect(rt.focusedNavId()).toBe('0');

      rt.moveFocus('down');          // 0 -> 0/1
      expect(rt.focusedNavId()).toBe('0/1');

      rt.moveFocus('up');            // back to 0 (single parent)
      expect(rt.focusedNavId()).toBe('0');

      rt.moveFocus('down');          // 0 -> 0/1
      rt.moveFocus('right');         // 0/1 -> 0/18
      expect(rt.focusedNavId()).toBe('0/18');

      rt.moveFocus('down');          // 0/18 -> 0/18/4 (Box B1)
      expect(rt.focusedNavId()).toBe('0/18/4');

      rt.moveFocus('up');            // multi-parent -> virtual
      const virtualId = rt.focusedNavId();
      expect(virtualId).toBe(`0/18/4${VIRTUAL_SUFFIX}`);
      const vnode = rt.getNavNode(virtualId)!;
      expect(vnode.kind).toBe('virtualParentContext');
      expect(vnode.childNavIds[0]).toBe('0/18'); // default: descended parent
      expect(vnode.childNavIds).toContain('0');  // other option: root

      rt.moveFocus('up');            // commit default -> 0/18
      expect(rt.focusedNavId()).toBe('0/18');

      // Now do the "right then up" variant — pick the other parent.
      rt.focus('0/18/4');
      rt.moveFocus('up');            // virtual again
      rt.moveFocus('right');         // cursor -> other option (root)
      rt.moveFocus('up');            // commit
      expect(rt.focusedNavId()).toBe('0');
      dispose();
    });
  });
});
