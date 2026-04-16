import { createRoot } from 'solid-js';
import { describe, expect, it } from 'vitest';
import {
  createNavigationRuntime,
  isVirtualNavId,
  VIRTUAL_SUFFIX,
  type MoveDirection,
  type NavigationRuntime,
} from 'olli-core';
import { diagramDomain } from '../domain.js';
import type { DiagramPayload } from '../spec/types.js';
import { pulleyMedium } from './pulleyMedium.js';

function makeRuntime(): NavigationRuntime<DiagramPayload> {
  return createNavigationRuntime(diagramDomain.toHypergraph(pulleyMedium));
}

function moves(rt: NavigationRuntime<DiagramPayload>, dirs: MoveDirection[]): string[] {
  const trace: string[] = [rt.focusedNavId()];
  for (const d of dirs) {
    rt.moveFocus(d);
    trace.push(rt.focusedNavId());
  }
  return trace;
}

describe('pulley acceptance — Trace A (descent and ascent)', () => {
  it('0 → 0/1 → 0/1/12 → (virtual) → 0/1 → 0', () => {
    // Note: the acceptance doc collapses ascent through multi-parent hyperedges
    // into a single step in its Trace A table, but per architecture §11.2 any
    // multi-parent edge synthesizes a virtual parent-context node on Up. Rope q
    // has parents [1, 18], so the ascent inserts a virtual stop before
    // committing to the default parent.
    createRoot((dispose) => {
      const rt = makeRuntime();
      expect(rt.focusedNavId()).toBe('0');
      const trace = moves(rt, ['down', 'down', 'up', 'up', 'up']);
      expect(trace).toEqual(['0', '0/1', '0/1/12', '0/1/12' + VIRTUAL_SUFFIX, '0/1', '0']);
      dispose();
    });
  });

  it('descriptions at each focus mention expected content', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      expect(rt.getDescriptionFor('0')()).toContain('Pulley diagram');
      expect(rt.getDescriptionFor('0/1')()).toContain('Pulley System A');
      expect(rt.getDescriptionFor('0/1')()).toContain('1 of 15');
      expect(rt.getDescriptionFor('0/1/12')()).toContain('Rope q');
      expect(rt.getDescriptionFor('0/1/12')()).toContain('Pulley System A');
      expect(rt.getDescriptionFor('0/1/12')()).toContain('1 of 3');
      dispose();
    });
  });
});

describe('pulley acceptance — Trace B (multi-parent ascent, virtual node)', () => {
  it('0 → 0/18 → 0/18/4 → 0/18/4/^ → 0/18 (commit default)', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('0/18');
      rt.moveFocus('down'); // → 0/18/4 (Box B1)
      expect(rt.focusedNavId()).toBe('0/18/4');
      rt.moveFocus('up'); // → virtual
      const virtualId = rt.focusedNavId();
      expect(isVirtualNavId(virtualId)).toBe(true);
      expect(virtualId).toBe('0/18/4' + VIRTUAL_SUFFIX);
      // commit default
      rt.moveFocus('up');
      expect(rt.focusedNavId()).toBe('0/18');
      dispose();
    });
  });

  it('virtual node description mentions both parents, default first', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('0/18/4');
      rt.moveFocus('up');
      const desc = rt.getDescriptionFor(rt.focusedNavId())();
      expect(desc).toContain('Parent contexts for Box B1');
      expect(desc).toContain('Default: Box B1 hangs from Rope q');
      expect(desc).toContain('Other options: Pulley diagram');
      dispose();
    });
  });

  it('Right on virtual cycles selection; Up commits to non-default parent', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('0/18/4');
      rt.moveFocus('up'); // virtual
      const virtualId = rt.focusedNavId();
      rt.moveFocus('right'); // cursor → 1 (Pulley diagram)
      expect(rt.focusedNavId()).toBe(virtualId);
      expect(rt.virtualCursor(virtualId)).toBe(1);
      rt.moveFocus('up'); // commit → Pulley diagram (NavId "0")
      expect(rt.focusedNavId()).toBe('0');
      dispose();
    });
  });
});

describe('pulley acceptance — Trace C (triple-parent, Floor)', () => {
  it('virtual node enumerates all three parents, default first', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('0/24');
      rt.moveFocus('down'); // first child: 14 (Rope s)
      rt.moveFocus('right'); // → 7 (Floor)
      expect(rt.focusedNavId()).toBe('0/24/7');
      rt.moveFocus('up');
      const virtualId = rt.focusedNavId();
      expect(isVirtualNavId(virtualId)).toBe(true);
      const desc = rt.getDescriptionFor(virtualId)();
      expect(desc).toContain('Parent contexts for Floor');
      expect(desc).toContain('3 options');
      expect(desc).toContain('Default: Rope s is anchored to Floor');
      expect(desc).toContain('Pulley diagram');
      expect(desc).toContain('Rope u is anchored to Floor');
      // commit default
      rt.moveFocus('up');
      expect(rt.focusedNavId()).toBe('0/24');
      dispose();
    });
  });
});

describe('pulley acceptance — Trace D (cross-system, Rope r)', () => {
  it('ascend from 0/1/13 and commit to "Pulley B hangs from Rope r" (21)', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('0/1');
      rt.moveFocus('down'); // → 12 (Rope q)
      rt.moveFocus('right'); // → 8 (Pulley A)
      rt.moveFocus('right'); // → 13 (Rope r)
      expect(rt.focusedNavId()).toBe('0/1/13');
      rt.moveFocus('up'); // virtual
      const virtualId = rt.focusedNavId();
      const desc = rt.getDescriptionFor(virtualId)();
      expect(desc).toContain('Parent contexts for Rope r');
      expect(desc).toContain('Default: Pulley System A');
      expect(desc).toContain('Pulley B hangs from Rope r');
      rt.moveFocus('right'); // cursor → 1
      rt.moveFocus('up'); // commit → 0/21 (Pulley B hangs from Rope r)
      expect(rt.focusedNavId()).toBe('0/21');
      rt.moveFocus('down'); // → 9 (Pulley B)
      expect(rt.focusedNavId()).toBe('0/21/9');
      dispose();
    });
  });
});

describe('pulley acceptance — edge cases', () => {
  it('Up from root is a no-op', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.moveFocus('up');
      expect(rt.focusedNavId()).toBe('0');
      dispose();
    });
  });

  it('Down on a virtual node is a no-op', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('0/18/4');
      rt.moveFocus('up'); // virtual
      const vid = rt.focusedNavId();
      rt.moveFocus('down');
      expect(rt.focusedNavId()).toBe(vid);
      dispose();
    });
  });
});
