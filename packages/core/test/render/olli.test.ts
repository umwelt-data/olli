import { afterEach, describe, expect, it } from 'vitest';
import { olli } from '../../src/index';
import type { UnitOlliSpec } from '../../src/Types';

afterEach(() => {
  document.body.innerHTML = '';
});

const sampleBarSpec = (): UnitOlliSpec => ({
  mark: 'bar',
  description: 'Sample bar chart',
  data: [
    { cat: 'A', value: 10 },
    { cat: 'B', value: 20 },
    { cat: 'C', value: 30 },
  ],
  fields: [
    { field: 'cat', type: 'nominal' },
    { field: 'value', type: 'quantitative' },
  ],
  axes: [
    { axisType: 'x', field: 'cat' },
    { axisType: 'y', field: 'value' },
  ],
  legends: [],
});

describe('olli() render (jsdom)', () => {
  it('returns a container with a role=tree element', () => {
    const container = olli(sampleBarSpec());
    document.body.appendChild(container);

    expect(container.tagName).toBe('DIV');
    expect(container.classList.contains('olli-vis')).toBe(true);

    const tree = container.querySelector('[role="tree"]');
    expect(tree).not.toBeNull();
    expect(tree!.tagName).toBe('UL');
  });

  it('labels every treeitem with aria-level/posinset/setsize', () => {
    const container = olli(sampleBarSpec());
    document.body.appendChild(container);

    const items = container.querySelectorAll('[role="treeitem"]');
    expect(items.length).toBeGreaterThan(0);
    items.forEach((item) => {
      expect(item.getAttribute('aria-level')).toMatch(/^\d+$/);
      expect(item.getAttribute('aria-posinset')).toMatch(/^\d+$/);
      expect(item.getAttribute('aria-setsize')).toMatch(/^\d+$/);
      expect(item.getAttribute('id')).toBeTruthy();
    });
  });

  it('renders a non-empty label on each treeitem', () => {
    const container = olli(sampleBarSpec());
    document.body.appendChild(container);
    const items = container.querySelectorAll('[role="treeitem"]');
    expect(items.length).toBeGreaterThan(0);
    items.forEach((item) => {
      const label = item.firstElementChild as HTMLElement | null;
      expect(label?.tagName).toBe('SPAN');
      const text = (label?.textContent ?? '').trim();
      expect(text.length).toBeGreaterThan(0);
    });
  });

  it('nests filteredData treeitems under the xAxis branch', () => {
    const container = olli(sampleBarSpec());
    document.body.appendChild(container);

    // root treeitem → axis group → axis-child treeitems (one per bar)
    const rootItem = container.querySelector('[role="tree"] > [role="treeitem"]');
    expect(rootItem).not.toBeNull();
    expect(rootItem!.getAttribute('aria-level')).toBe('1');
    const axisGroup = rootItem!.querySelector(':scope > [role="group"]');
    expect(axisGroup).not.toBeNull();
    // first level under root = the xAxis node (one child).
    const axisItem = axisGroup!.querySelector(':scope > [role="treeitem"]');
    expect(axisItem).not.toBeNull();
    const binGroup = axisItem!.querySelector(':scope > [role="group"]');
    expect(binGroup).not.toBeNull();
    expect(binGroup!.querySelectorAll(':scope > [role="treeitem"]').length).toBe(3);
  });
});
