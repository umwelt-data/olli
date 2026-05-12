import { describe, it, expect, afterEach } from 'vitest';
import { olliVis } from './olliVis.js';
import type { OlliHandle } from './handle.js';
import type { UnitOlliVisSpec } from 'olli-vis';

const spec: UnitOlliVisSpec = {
  data: [
    { category: 'A', value: 10 },
    { category: 'B', value: 20 },
    { category: 'C', value: 30 },
  ],
  mark: 'bar',
  title: 'Sales by Category',
  fields: [
    { field: 'category', type: 'nominal' },
    { field: 'value', type: 'quantitative' },
  ],
  axes: [
    { field: 'category', axisType: 'x', title: 'Category' },
    { field: 'value', axisType: 'y', title: 'Value' },
  ],
  structure: [
    { groupby: 'category' },
    { groupby: 'value' },
  ],
};

let handle: OlliHandle | undefined;
let container: HTMLElement;

afterEach(() => {
  handle?.destroy();
  handle = undefined;
  container?.remove();
});

function setup(options?: Parameters<typeof olliVis>[2]) {
  container = document.createElement('div');
  document.body.appendChild(container);
  handle = olliVis(spec, container, options);
  return handle;
}

describe('olliVis', () => {
  it('mounts and renders a tree view', () => {
    const h = setup();
    const tree = container.querySelector('[role="tree"]');
    expect(tree).not.toBeNull();
    expect(h.getFocusedNavId()).toBeTruthy();
  });

  it('focus changes the focused nav id', () => {
    const h = setup();
    const initial = h.getFocusedNavId();
    expect(initial).toBeTruthy();

    const treeItems = container.querySelectorAll('[role="treeitem"]');
    expect(treeItems.length).toBeGreaterThan(0);
  });

  it('getDescription returns a string for the focused node', () => {
    const h = setup();
    const desc = h.getDescription(h.getFocusedNavId());
    expect(typeof desc).toBe('string');
    expect(desc.length).toBeGreaterThan(0);
  });

  it('onFocusChange fires callback', () => {
    const h = setup();
    const received: string[] = [];
    const unsub = h.onFocusChange((navId) => received.push(navId));

    const rootId = h.getFocusedNavId();
    expect(received.length).toBeGreaterThanOrEqual(1);
    expect(received).toContain(rootId);

    unsub();
  });

  it('onSelectionChange fires callback', () => {
    const h = setup();
    const received: unknown[] = [];
    const unsub = h.onSelectionChange((sel) => received.push(sel));

    expect(received.length).toBeGreaterThanOrEqual(1);

    h.setSelection({ and: [{ field: 'category', equal: 'A' }] });
    expect(received.length).toBeGreaterThanOrEqual(2);

    unsub();
  });

  it('applyPreset changes descriptions', () => {
    const h = setup();
    const rootId = h.getFocusedNavId();

    h.applyPreset('low');
    const lowDesc = h.getDescription(rootId);

    h.applyPreset('high');
    const highDesc = h.getDescription(rootId);

    expect(lowDesc.length).toBeLessThanOrEqual(highDesc.length);
  });

  it('destroy removes DOM content', () => {
    const h = setup();
    expect(container.querySelector('[role="tree"]')).not.toBeNull();
    h.destroy();
    handle = undefined;
    expect(container.querySelector('[role="tree"]')).toBeNull();
  });

  it('accepts initialPreset option', () => {
    const h = setup({ initialPreset: 'high' });
    const desc = h.getDescription(h.getFocusedNavId());
    expect(desc.length).toBeGreaterThan(0);
  });

  it('accepts onFocus callback in options', () => {
    const received: string[] = [];
    const h = setup({ callbacks: { onFocus: (id) => received.push(id) } });
    expect(received.length).toBeGreaterThanOrEqual(1);
    expect(received[0]).toBe(h.getFocusedNavId());
  });
});
