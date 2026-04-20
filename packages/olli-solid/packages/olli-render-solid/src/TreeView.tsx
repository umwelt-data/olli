import { For, createEffect } from 'solid-js';
import type { NavigationRuntime, NavNodeId } from 'olli-core';
import { isVirtualNavId, sourceNavIdOfVirtual } from 'olli-core';
import { TreeItem } from './TreeItem.jsx';
import { registerDefaultKeybindings } from './keybindings.js';

export function TreeView<P>(props: { runtime: NavigationRuntime<P> }) {
  registerDefaultKeybindings(props.runtime);

  let treeEl: HTMLUListElement | undefined;

  const handleKeyDown = (e: KeyboardEvent) => {
    const consumed = props.runtime.keybindings.dispatch(props.runtime, e);
    if (consumed) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  createEffect(() => {
    const id = props.runtime.focusedNavId();
    if (!treeEl) return;
    const el = treeEl.querySelector<HTMLElement>(
      `[data-nav-id="${CSS.escape(id)}"]`,
    );
    if (el && document.activeElement !== el) el.focus();
  });

  createEffect(() => {
    const id = props.runtime.focusedNavId();
    const ancestors = new Set<NavNodeId>();
    const startId = isVirtualNavId(id) ? sourceNavIdOfVirtual(id) : id;
    const startNode = props.runtime.getNavNode(startId);
    let cursor: NavNodeId | null = startNode?.parentNavId ?? null;
    while (cursor) {
      if (ancestors.has(cursor)) break;
      ancestors.add(cursor);
      const node = props.runtime.getNavNode(cursor);
      cursor = node?.parentNavId ?? null;
    }
    props.runtime.setExpanded(ancestors);
  });

  const roots = () => props.runtime.navTree().roots;

  return (
    <ul
      ref={treeEl}
      role="tree"
      class="olli-vis olli-tree"
      onKeyDown={handleKeyDown}
    >
      <For each={roots()}>
        {(rootId, i) => (
          <TreeItem
            runtime={props.runtime}
            navId={rootId}
            level={1}
            posInSet={i() + 1}
            setSize={roots().length}
          />
        )}
      </For>
    </ul>
  );
}
