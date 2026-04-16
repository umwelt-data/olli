import { For, Show, createMemo } from 'solid-js';
import type { NavigationRuntime, NavNodeId } from 'olli-core';
import { VIRTUAL_SUFFIX } from 'olli-core';
import { NodeLabel } from './NodeLabel.jsx';

export function TreeItem<P>(props: {
  runtime: NavigationRuntime<P>;
  navId: NavNodeId;
  level: number;
  posInSet: number;
  setSize: number;
}) {
  const node = createMemo(() => props.runtime.getNavNode(props.navId));
  const childIds = createMemo(() => node()?.childNavIds ?? []);
  const focused = () => props.runtime.focusedNavId() === props.navId;
  const expanded = () => props.runtime.expanded().has(props.navId);
  const hasChildren = () => childIds().length > 0;

  const virtualNavId = props.navId + VIRTUAL_SUFFIX;
  const virtualFocused = () => props.runtime.focusedNavId() === virtualNavId;

  const showGroup = () => hasChildren() || virtualFocused();
  const ariaExpanded = () => {
    if (!hasChildren() && !virtualFocused()) return undefined;
    if (virtualFocused()) return 'true';
    return expanded() ? 'true' : 'false';
  };

  return (
    <li
      role="treeitem"
      data-nav-id={props.navId}
      aria-level={props.level}
      aria-posinset={props.posInSet}
      aria-setsize={props.setSize}
      aria-selected={focused() ? 'true' : 'false'}
      aria-expanded={ariaExpanded()}
      tabindex={focused() ? 0 : -1}
      class="olli-tree-item"
      classList={{ 'olli-focused': focused() }}
    >
      <NodeLabel runtime={props.runtime} navId={props.navId} />
      <Show when={showGroup()}>
        <ul role="group" class="olli-tree-group">
          <For each={childIds()}>
            {(childId, i) => (
              <TreeItem
                runtime={props.runtime}
                navId={childId}
                level={props.level + 1}
                posInSet={i() + 1}
                setSize={childIds().length}
              />
            )}
          </For>
          <Show when={virtualFocused()}>
            <VirtualTreeItem
              runtime={props.runtime}
              navId={virtualNavId}
              level={props.level + 1}
            />
          </Show>
        </ul>
      </Show>
    </li>
  );
}

function VirtualTreeItem<P>(props: {
  runtime: NavigationRuntime<P>;
  navId: NavNodeId;
  level: number;
}) {
  const focused = () => props.runtime.focusedNavId() === props.navId;
  return (
    <li
      role="treeitem"
      data-nav-id={props.navId}
      data-virtual="true"
      aria-level={props.level}
      aria-posinset={1}
      aria-setsize={1}
      aria-selected={focused() ? 'true' : 'false'}
      tabindex={focused() ? 0 : -1}
      class="olli-tree-item olli-virtual"
      classList={{ 'olli-focused': focused() }}
    >
      <NodeLabel runtime={props.runtime} navId={props.navId} />
    </li>
  );
}
