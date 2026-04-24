import { cleanup, fireEvent, render } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vitest';
import { createNavigationRuntime, registerDomain } from 'olli-core';
import { diagramDomain, pulleyMedium } from 'olli-diagram';
import { TreeView } from 'olli-render-solid';

afterEach(() => cleanup());

function setup() {
  let rt!: ReturnType<typeof createNavigationRuntime<import('olli-diagram').DiagramPayload>>;
  const { container } = render(() => {
    rt = createNavigationRuntime(diagramDomain.toHypergraph(pulleyMedium));
    registerDomain(rt, diagramDomain);
    return <TreeView runtime={rt} />;
  });
  return { runtime: rt, container };
}

describe('pulley example — DOM acceptance', () => {
  it('mounts and renders an ARIA tree with the 26 pulley hyperedges', () => {
    const { container } = setup();
    const tree = container.querySelector('[role="tree"]')!;
    expect(tree).toBeTruthy();

    // Root is one treeitem; each of its 15 children, and each of their
    // descendants, produce further treeitems. We check a sample:
    const root = container.querySelector<HTMLElement>('[data-nav-id="0"]')!;
    expect(root.getAttribute('aria-level')).toBe('1');
    const systemA = container.querySelector<HTMLElement>('[data-nav-id="0/1"]')!;
    expect(systemA.getAttribute('aria-level')).toBe('2');
    expect(systemA.getAttribute('aria-posinset')).toBe('1');
    expect(systemA.getAttribute('aria-setsize')).toBe('15');

    // Rope q under Pulley System A
    const ropeQ = container.querySelector<HTMLElement>('[data-nav-id="0/1/12"]')!;
    expect(ropeQ.getAttribute('aria-level')).toBe('3');
  });

  it('Trace B end-to-end: focus Box B1 under 18, Up produces virtual siblings, Up commits', () => {
    const { runtime, container } = setup();
    runtime.focus('0/18/4');
    expect(container.querySelector('[data-virtual="true"]')).toBeNull();

    const tree = container.querySelector('[role="tree"]')!;
    fireEvent.keyDown(tree, { key: 'ArrowUp' });

    const virtuals = container.querySelectorAll<HTMLElement>('[data-virtual="true"]');
    expect(virtuals.length).toBe(2);
    expect(virtuals[0]!.getAttribute('data-nav-id')).toBe('0/18/4/^0');
    expect(virtuals[0]!.getAttribute('aria-selected')).toBe('true');
    const label0 = virtuals[0]!.querySelector('.olli-node-label')!.textContent ?? '';
    expect(label0).toContain('Parent context for Box B1');
    expect(label0).toContain('Box B1 hangs from Rope q');
    expect(label0).toContain('(default)');
    const label1 = virtuals[1]!.querySelector('.olli-node-label')!.textContent ?? '';
    expect(label1).toContain('Pulley diagram');
    expect(label1).not.toContain('(default)');

    fireEvent.keyDown(tree, { key: 'ArrowUp' }); // commit
    expect(runtime.focusedNavId()).toBe('0/18');
    expect(container.querySelector('[data-virtual="true"]')).toBeNull();
  });

  it('Trace C: Floor virtual siblings enumerate 3 parents', () => {
    const { runtime, container } = setup();
    runtime.focus('0/24');
    const tree = container.querySelector('[role="tree"]')!;
    fireEvent.keyDown(tree, { key: 'ArrowDown' }); // → 0/24/14
    fireEvent.keyDown(tree, { key: 'ArrowRight' }); // → 0/24/7 (Floor)
    expect(runtime.focusedNavId()).toBe('0/24/7');
    fireEvent.keyDown(tree, { key: 'ArrowUp' });
    const virtuals = container.querySelectorAll<HTMLElement>('[data-virtual="true"]');
    expect(virtuals.length).toBe(3);
    const labels = Array.from(virtuals).map(
      (v) => v.querySelector('.olli-node-label')!.textContent ?? '',
    );
    expect(labels[0]).toContain('Parent context for Floor');
    expect(labels[0]).toContain('Rope s is anchored to Floor');
    expect(labels[0]).toContain('(default)');
    expect(labels[1]).toContain('Pulley diagram');
    expect(labels[2]).toContain('Rope u is anchored to Floor');
  });

  it('Trace D: Rope r ascent, switch parent sibling, commit to "Pulley B hangs from Rope r"', () => {
    const { runtime, container } = setup();
    runtime.focus('0/1/13');
    const tree = container.querySelector('[role="tree"]')!;
    fireEvent.keyDown(tree, { key: 'ArrowUp' }); // /^0 (default)
    expect(runtime.focusedNavId()).toBe('0/1/13/^0');
    fireEvent.keyDown(tree, { key: 'ArrowRight' }); // /^1
    expect(runtime.focusedNavId()).toBe('0/1/13/^1');
    fireEvent.keyDown(tree, { key: 'ArrowUp' }); // commit
    expect(runtime.focusedNavId()).toBe('0/21');
  });
});
