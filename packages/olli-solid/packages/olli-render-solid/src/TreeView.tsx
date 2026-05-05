import { For, Show, createEffect, createMemo } from 'solid-js';
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
    queueMicrotask(() => {
      const el = treeEl!.querySelector<HTMLElement>(
        `[data-nav-id="${CSS.escape(id)}"]`,
      );
      if (el && document.activeElement !== el) el.focus();
    });
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

  const activeContextRoot = createMemo((): NavNodeId | null => {
    const id = props.runtime.focusedNavId();
    const resolvedId = isVirtualNavId(id) ? sourceNavIdOfVirtual(id) : id;
    const contextRoots = props.runtime.navTree().contextRoots;
    return contextRoots.find(rootId => resolvedId === rootId || resolvedId.startsWith(rootId + '/')) ?? null;
  });

  const totalSetSize = () => roots().length + (activeContextRoot() ? 1 : 0);

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
            setSize={totalSetSize()}
          />
        )}
      </For>
      <Show when={activeContextRoot()}>
        {(rootId) => (
          <TreeItem
            runtime={props.runtime}
            navId={rootId()}
            level={1}
            posInSet={roots().length + 1}
            setSize={totalSetSize()}
          />
        )}
      </Show>
    </ul>
  );
}
