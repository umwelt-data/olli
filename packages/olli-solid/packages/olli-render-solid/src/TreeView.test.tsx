import { cleanup, fireEvent, render } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vitest';
import type { Hyperedge, NavigationRuntime, TokenContext } from 'olli-core';
import {
  buildHypergraph,
  createNavigationRuntime,
  VIRTUAL_ROLE,
} from 'olli-core';
import { TreeView } from './TreeView.jsx';

afterEach(() => cleanup());

function edge(
  id: string,
  displayName: string,
  children: string[] = [],
  parents: string[] = [],
): Hyperedge {
  return { id, displayName, children, parents };
}

function smallGraph() {
  return buildHypergraph([
    edge('root', 'Diagram', ['a', 'b']),
    edge('a', 'Group A', ['a1', 'a2'], ['root']),
    edge('a1', 'Leaf A1', [], ['a']),
    edge('a2', 'Leaf A2', [], ['a']),
    edge('b', 'Group B', [], ['root']),
  ]);
}

/**
 * Create the runtime inside render's reactive root so Solid's memos are
 * properly owned (avoids the "computations created outside a createRoot"
 * warning).
 */
function renderWith<P>(
  buildRt: () => NavigationRuntime<P>,
): { runtime: NavigationRuntime<P>; container: HTMLElement } {
  let rt!: NavigationRuntime<P>;
  const { container } = render(() => {
    rt = buildRt();
    return <TreeView runtime={rt} />;
  });
  return { runtime: rt, container };
}

function labelOf(container: HTMLElement, navId: string): string {
  const el = container.querySelector<HTMLElement>(
    `[data-nav-id="${CSS.escape(navId)}"] > .olli-node-label`,
  );
  return el?.textContent ?? '';
}

describe('<TreeView /> — ARIA structure', () => {
  it('renders a tree with correct roles and attributes', () => {
    const { container } = renderWith(() => createNavigationRuntime(smallGraph()));

    const tree = container.querySelector('[role="tree"]')!;
    expect(tree).toBeTruthy();
    expect(tree.tagName).toBe('UL');

    const items = container.querySelectorAll('[role="treeitem"]');
    expect(items.length).toBe(5);

    const root = container.querySelector<HTMLElement>('[data-nav-id="root"]')!;
    expect(root.getAttribute('aria-level')).toBe('1');
    expect(root.getAttribute('aria-posinset')).toBe('1');
    expect(root.getAttribute('aria-setsize')).toBe('1');
    expect(root.getAttribute('aria-expanded')).toBe('false');

    const a = container.querySelector<HTMLElement>('[data-nav-id="root/a"]')!;
    expect(a.getAttribute('aria-level')).toBe('2');
    expect(a.getAttribute('aria-posinset')).toBe('1');
    expect(a.getAttribute('aria-setsize')).toBe('2');

    const b = container.querySelector<HTMLElement>('[data-nav-id="root/b"]')!;
    expect(b.getAttribute('aria-posinset')).toBe('2');
    expect(b.getAttribute('aria-setsize')).toBe('2');
    expect(b.getAttribute('aria-expanded')).toBeNull();

    const a1 = container.querySelector<HTMLElement>('[data-nav-id="root/a/a1"]')!;
    expect(a1.getAttribute('aria-level')).toBe('3');
  });

  it('root is initially focused and selected', () => {
    const { container } = renderWith(() => createNavigationRuntime(smallGraph()));
    const root = container.querySelector<HTMLElement>('[data-nav-id="root"]')!;
    expect(root.getAttribute('aria-selected')).toBe('true');
    expect(root.getAttribute('tabindex')).toBe('0');
  });
});

describe('<TreeView /> — keyboard navigation', () => {
  it('ArrowDown moves focus to first child and updates aria-selected', () => {
    const { runtime, container } = renderWith(() =>
      createNavigationRuntime(smallGraph()),
    );
    const tree = container.querySelector('[role="tree"]')!;
    fireEvent.keyDown(tree, { key: 'ArrowDown' });
    expect(runtime.focusedNavId()).toBe('root/a');
    const a = container.querySelector<HTMLElement>('[data-nav-id="root/a"]')!;
    expect(a.getAttribute('aria-selected')).toBe('true');
    const root = container.querySelector<HTMLElement>('[data-nav-id="root"]')!;
    expect(root.getAttribute('aria-selected')).toBe('false');
  });

  it('ArrowRight/ArrowLeft cycle siblings', () => {
    const { runtime, container } = renderWith(() =>
      createNavigationRuntime(smallGraph()),
    );
    runtime.focus('root/a');
    const tree = container.querySelector('[role="tree"]')!;
    fireEvent.keyDown(tree, { key: 'ArrowRight' });
    expect(runtime.focusedNavId()).toBe('root/b');
    fireEvent.keyDown(tree, { key: 'ArrowLeft' });
    expect(runtime.focusedNavId()).toBe('root/a');
  });

  it('ArrowUp returns to parent', () => {
    const { runtime, container } = renderWith(() =>
      createNavigationRuntime(smallGraph()),
    );
    runtime.focus('root/a/a1');
    const tree = container.querySelector('[role="tree"]')!;
    fireEvent.keyDown(tree, { key: 'ArrowUp' });
    expect(runtime.focusedNavId()).toBe('root/a');
  });

  it('Enter and Space descend like ArrowDown', () => {
    const { runtime, container } = renderWith(() =>
      createNavigationRuntime(smallGraph()),
    );
    const tree = container.querySelector('[role="tree"]')!;
    fireEvent.keyDown(tree, { key: 'Enter' });
    expect(runtime.focusedNavId()).toBe('root/a');
    fireEvent.keyDown(tree, { key: ' ' });
    expect(runtime.focusedNavId()).toBe('root/a/a1');
  });

  it('Escape ascends like ArrowUp', () => {
    const { runtime, container } = renderWith(() =>
      createNavigationRuntime(smallGraph()),
    );
    runtime.focus('root/a/a1');
    const tree = container.querySelector('[role="tree"]')!;
    fireEvent.keyDown(tree, { key: 'Escape' });
    expect(runtime.focusedNavId()).toBe('root/a');
    fireEvent.keyDown(tree, { key: 'Escape' });
    expect(runtime.focusedNavId()).toBe('root');
  });

  it("'o' jumps focus to the first root", () => {
    const { runtime, container } = renderWith(() =>
      createNavigationRuntime(smallGraph()),
    );
    runtime.focus('root/a/a1');
    const tree = container.querySelector('[role="tree"]')!;
    fireEvent.keyDown(tree, { key: 'o' });
    expect(runtime.focusedNavId()).toBe('root');
  });

  it('click on a non-focused label focuses it', () => {
    const { runtime, container } = renderWith(() =>
      createNavigationRuntime(smallGraph()),
    );
    runtime.focus('root/a');
    const bLabel = container.querySelector<HTMLElement>(
      '[data-nav-id="root/b"] > .olli-node-label',
    )!;
    fireEvent.click(bLabel);
    expect(runtime.focusedNavId()).toBe('root/b');
  });

  it('click on the already-focused label descends into its first child', () => {
    const { runtime, container } = renderWith(() =>
      createNavigationRuntime(smallGraph()),
    );
    runtime.focus('root/a');
    const aLabel = container.querySelector<HTMLElement>(
      '[data-nav-id="root/a"] > .olli-node-label',
    )!;
    fireEvent.click(aLabel);
    expect(runtime.focusedNavId()).toBe('root/a/a1');
  });

  it('focus-path expansion: only the ancestors of the focused node are expanded', () => {
    const { runtime, container } = renderWith(() =>
      createNavigationRuntime(smallGraph()),
    );
    const root = container.querySelector<HTMLElement>('[data-nav-id="root"]')!;
    const a = container.querySelector<HTMLElement>('[data-nav-id="root/a"]')!;

    // Initial focus on root: root has no ancestors, so nothing is expanded.
    // The focused node itself is collapsed; its children are not shown until
    // the user navigates down.
    expect(root.getAttribute('aria-expanded')).toBe('false');

    // Focusing a child expands the parent (but not the focused node itself).
    runtime.focus('root/a');
    expect(root.getAttribute('aria-expanded')).toBe('true');
    expect(a.getAttribute('aria-expanded')).toBe('false');

    // Focusing a leaf expands every ancestor on the path.
    runtime.focus('root/a/a1');
    expect(root.getAttribute('aria-expanded')).toBe('true');
    expect(a.getAttribute('aria-expanded')).toBe('true');

    // Moving focus back up collapses the sibling branch again.
    runtime.focus('root');
    expect(root.getAttribute('aria-expanded')).toBe('false');
    expect(a.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('<TreeView /> — virtual parent-context node', () => {
  it('renders a virtual tree item after ArrowUp from a multi-parent node', () => {
    const { runtime, container } = renderWith(() =>
      createNavigationRuntime(
        buildHypergraph([
          edge('root', 'Diagram', ['x', 'hangs']),
          edge('hangs', 'Hangs relation', ['x'], ['root']),
          edge('x', 'Box B1', [], ['root', 'hangs']),
        ]),
      ),
    );
    runtime.focus('root/hangs/x');
    expect(container.querySelector('[data-virtual="true"]')).toBeNull();

    const tree = container.querySelector('[role="tree"]')!;
    fireEvent.keyDown(tree, { key: 'ArrowUp' });

    const virtual = container.querySelector<HTMLElement>('[data-virtual="true"]');
    expect(virtual).toBeTruthy();
    expect(virtual!.getAttribute('aria-selected')).toBe('true');
    const virtualLabel = virtual!.querySelector('.olli-node-label')!.textContent ?? '';
    expect(virtualLabel).toContain('Parent contexts for Box B1');
    expect(virtualLabel).toContain('Default: Hangs relation');
    expect(virtualLabel).toContain('Other options: Diagram');
  });
});

describe('<TreeView /> — reactivity', () => {
  it('label updates when the recipe changes at runtime', () => {
    const { runtime, container } = renderWith(() =>
      createNavigationRuntime(smallGraph()),
    );
    expect(labelOf(container, 'root/a')).toContain('Group A');

    runtime.customization.setFor('', {
      role: '',
      recipe: [{ token: 'name', brevity: 'short' }],
      duration: 'persistent',
    });
    expect(labelOf(container, 'root/a')).toBe('Group A');
  });

  it('custom selection-dependent token updates after setSelection', () => {
    const { runtime, container } = renderWith(() => {
      const rt = createNavigationRuntime(smallGraph());
      rt.registerToken({
        name: 'selSize',
        applicableRoles: '*',
        compute: (ctx: TokenContext<unknown>) => {
          const sel = ctx.selection;
          const n = 'and' in sel ? sel.and.length : 0;
          const s = `sel=${n}`;
          return { short: s, long: s };
        },
      });
      rt.customization.setFor('', {
        role: '',
        recipe: [
          { token: 'name', brevity: 'short' },
          { token: 'selSize', brevity: 'short' },
        ],
        duration: 'persistent',
      });
      return rt;
    });
    expect(labelOf(container, 'root/a')).toContain('sel=0');
    runtime.setSelection({ and: [{ field: 'q', equal: 1 }] });
    expect(labelOf(container, 'root/a')).toContain('sel=1');
  });

  it('virtual role uses default virtual recipe independent of role customization', () => {
    const { runtime, container } = renderWith(() => {
      const rt = createNavigationRuntime(
        buildHypergraph([
          edge('root', 'Diagram', ['x', 'hangs']),
          edge('hangs', 'Hangs relation', ['x'], ['root']),
          edge('x', 'Box B1', [], ['root', 'hangs']),
        ]),
      );
      rt.customization.setFor('', {
        role: '',
        recipe: [{ token: 'name', brevity: 'short' }],
        duration: 'persistent',
      });
      return rt;
    });
    runtime.focus('root/hangs/x');
    const tree = container.querySelector('[role="tree"]')!;
    fireEvent.keyDown(tree, { key: 'ArrowUp' });

    const virtual = container.querySelector<HTMLElement>('[data-virtual="true"]')!;
    const virtualLabel = virtual.querySelector('.olli-node-label')!.textContent ?? '';
    expect(virtualLabel).toContain('Parent contexts for Box B1');
    expect(VIRTUAL_ROLE).toBe('__virtualParentContext__');
  });
});
