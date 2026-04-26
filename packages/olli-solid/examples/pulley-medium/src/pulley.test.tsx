import { cleanup, fireEvent, render } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vitest';
import { createNavigationRuntime, registerDomain } from 'olli-core';
import { diagramDomain, pulleySpec } from 'olli-diagram';
import { TreeView } from 'olli-render-solid';

afterEach(() => cleanup());

function setup() {
  let rt!: ReturnType<typeof createNavigationRuntime<import('olli-diagram').DiagramPayload>>;
  const { container } = render(() => {
    rt = createNavigationRuntime(diagramDomain.toHypergraph(pulleySpec));
    registerDomain(rt, diagramDomain);
    return <TreeView runtime={rt} />;
  });
  return { runtime: rt, container };
}

describe('pulley example — DOM acceptance', () => {
  it('mounts and renders an ARIA tree', () => {
    const { container } = setup();
    const tree = container.querySelector('[role="tree"]')!;
    expect(tree).toBeTruthy();

    const root = container.querySelector<HTMLElement>('[data-nav-id="root"]')!;
    expect(root.getAttribute('aria-level')).toBe('1');
    const sysB = container.querySelector<HTMLElement>('[data-nav-id="root/sysB"]')!;
    expect(sysB.getAttribute('aria-level')).toBe('2');
    expect(sysB.getAttribute('aria-posinset')).toBe('1');
    expect(sysB.getAttribute('aria-setsize')).toBe('11');
  });

  it('multi-parent ascent: Pulley B has 2 virtual siblings', () => {
    const { runtime, container } = setup();
    runtime.focus('root/sysB/B');
    const tree = container.querySelector('[role="tree"]')!;
    fireEvent.keyDown(tree, { key: 'ArrowUp' });
    const virtuals = container.querySelectorAll<HTMLElement>('[data-virtual="true"]');
    expect(virtuals.length).toBe(2);
    const label0 = virtuals[0]!.querySelector('.olli-node-label')!.textContent ?? '';
    expect(label0).toContain('Pulley System B');
    expect(label0).toContain('(default)');
    const label1 = virtuals[1]!.querySelector('.olli-node-label')!.textContent ?? '';
    expect(label1).toContain('Pulley B hangs from Axle rope');
  });

  it('cross-system: Rope x ascent, switch to h-A-l1, commit', () => {
    const { runtime, container } = setup();
    runtime.focus('root/sysB/l1');
    const tree = container.querySelector('[role="tree"]')!;
    fireEvent.keyDown(tree, { key: 'ArrowUp' }); // ^0 (default = sysB)
    expect(runtime.focusedNavId()).toBe('root/sysB/l1/^0');
    fireEvent.keyDown(tree, { key: 'ArrowRight' }); // ^1 (h-A-l1)
    expect(runtime.focusedNavId()).toBe('root/sysB/l1/^1');
    fireEvent.keyDown(tree, { key: 'ArrowUp' }); // commit
    expect(runtime.focusedNavId()).toBe('root/h-A-l1');
  });
});
