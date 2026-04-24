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
  it('0 → 0/1 → 0/1/12 → (default virtual sibling) → 0/1 → 0', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      expect(rt.focusedNavId()).toBe('0');
      const trace = moves(rt, ['down', 'down', 'up', 'up', 'up']);
      expect(trace).toEqual([
        '0',
        '0/1',
        '0/1/12',
        '0/1/12' + VIRTUAL_SUFFIX + '0',
        '0/1',
        '0',
      ]);
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

describe('pulley acceptance — Trace B (multi-parent ascent, virtual sibling layer)', () => {
  it('0 → 0/18 → 0/18/4 → 0/18/4/^0 → 0/18 (commit default)', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('0/18');
      rt.moveFocus('down'); // → 0/18/4 (Box B1)
      expect(rt.focusedNavId()).toBe('0/18/4');
      rt.moveFocus('up'); // → default virtual sibling
      const defaultId = rt.focusedNavId();
      expect(isVirtualNavId(defaultId)).toBe(true);
      expect(defaultId).toBe('0/18/4' + VIRTUAL_SUFFIX + '0');
      // commit default
      rt.moveFocus('up');
      expect(rt.focusedNavId()).toBe('0/18');
      dispose();
    });
  });

  it('two virtual siblings exist, each with its own singular description', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('0/18/4');
      rt.moveFocus('up');
      const ids = rt.virtualOptionsFor('0/18/4');
      expect(ids).toEqual([
        '0/18/4' + VIRTUAL_SUFFIX + '0',
        '0/18/4' + VIRTUAL_SUFFIX + '1',
      ]);
      const defaultDesc = rt.getDescriptionFor(ids[0]!)();
      expect(defaultDesc).toContain('Parent context for Box B1');
      expect(defaultDesc).toContain('Box B1 hangs from Rope q');
      expect(defaultDesc).toContain('(default)');
      const otherDesc = rt.getDescriptionFor(ids[1]!)();
      expect(otherDesc).toContain('Parent context for Box B1');
      expect(otherDesc).toContain('Pulley diagram');
      expect(otherDesc).not.toContain('(default)');
      dispose();
    });
  });

  it('Right moves between virtual siblings; Up commits to non-default parent', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('0/18/4');
      rt.moveFocus('up'); // /^0
      expect(rt.focusedNavId()).toBe('0/18/4' + VIRTUAL_SUFFIX + '0');
      rt.moveFocus('right'); // /^1
      expect(rt.focusedNavId()).toBe('0/18/4' + VIRTUAL_SUFFIX + '1');
      rt.moveFocus('up'); // commit → Pulley diagram (NavId "0")
      expect(rt.focusedNavId()).toBe('0');
      dispose();
    });
  });
});

describe('pulley acceptance — Trace C (triple-parent, Floor)', () => {
  it('three virtual siblings surface, default first, each with singular description', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('0/24');
      rt.moveFocus('down'); // first child: 14 (Rope s)
      rt.moveFocus('right'); // → 7 (Floor)
      expect(rt.focusedNavId()).toBe('0/24/7');
      rt.moveFocus('up');
      const ids = rt.virtualOptionsFor('0/24/7');
      expect(ids).toHaveLength(3);
      expect(ids[0]).toBe('0/24/7' + VIRTUAL_SUFFIX + '0');
      expect(ids[1]).toBe('0/24/7' + VIRTUAL_SUFFIX + '1');
      expect(ids[2]).toBe('0/24/7' + VIRTUAL_SUFFIX + '2');
      expect(rt.focusedNavId()).toBe(ids[0]);
      const d0 = rt.getDescriptionFor(ids[0]!)();
      expect(d0).toContain('Parent context for Floor');
      expect(d0).toContain('Rope s is anchored to Floor');
      expect(d0).toContain('(default)');
      const d1 = rt.getDescriptionFor(ids[1]!)();
      expect(d1).toContain('Pulley diagram');
      const d2 = rt.getDescriptionFor(ids[2]!)();
      expect(d2).toContain('Rope u is anchored to Floor');
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
      rt.moveFocus('up'); // /^0 (default)
      expect(rt.focusedNavId()).toBe('0/1/13' + VIRTUAL_SUFFIX + '0');
      const d0 = rt.getDescriptionFor(rt.focusedNavId())();
      expect(d0).toContain('Parent context for Rope r');
      expect(d0).toContain('Pulley System A');
      rt.moveFocus('right'); // /^1
      expect(rt.focusedNavId()).toBe('0/1/13' + VIRTUAL_SUFFIX + '1');
      const d1 = rt.getDescriptionFor(rt.focusedNavId())();
      expect(d1).toContain('Pulley B hangs from Rope r');
      rt.moveFocus('up'); // commit → 0/21
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

  it('Down on the default virtual returns to the original source', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('0/18/4');
      rt.moveFocus('up');
      expect(rt.focusedNavId()).toBe('0/18/4' + VIRTUAL_SUFFIX + '0');
      rt.moveFocus('down');
      expect(rt.focusedNavId()).toBe('0/18/4');
      dispose();
    });
  });

  it('Down on a non-default virtual regroups source under alternate parent', () => {
    createRoot((dispose) => {
      const rt = makeRuntime();
      rt.focus('0/18/4');
      rt.moveFocus('up');
      rt.moveFocus('right');
      expect(rt.focusedNavId()).toBe('0/18/4' + VIRTUAL_SUFFIX + '1');
      rt.moveFocus('down');
      expect(rt.focusedNavId()).toBe('0/4');
      dispose();
    });
  });
});
