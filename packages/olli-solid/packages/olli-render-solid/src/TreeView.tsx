import { For, createEffect } from 'solid-js';
import type { NavigationRuntime } from 'olli-core';
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

  const roots = () => props.runtime.navTree().roots;

  return (
    <ul
      ref={treeEl}
      role="tree"
      class="olli-tree"
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
