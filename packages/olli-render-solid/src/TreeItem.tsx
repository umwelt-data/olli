import { For, Show, createMemo } from 'solid-js';
import { isVirtualNavId, sourceNavIdOfVirtual } from 'olli-core';
import type { NavigationRuntime, NavNodeId } from 'olli-core';
import { NodeLabel } from './NodeLabel.jsx';

export function TreeItem<P>(props: {
  runtime: NavigationRuntime<P>;
  navId: NavNodeId;
  level: number;
  posInSet: number;
  setSize: number;
}) {
  const node = createMemo(() => props.runtime.getNavNode(props.navId));
  const isVirtual = () => node()?.kind === 'virtualParentContext';
  const childIds = createMemo(() => node()?.childNavIds ?? []);
  const focused = () => props.runtime.focusedNavId() === props.navId;
  const expanded = () => props.runtime.expanded().has(props.navId);
  const hasChildren = () => childIds().length > 0;

  const showGroup = () => hasChildren();
  const ariaExpanded = () => {
    if (!hasChildren()) return undefined;
    return expanded() ? 'true' : 'false';
  };

  const activeVirtualSource = createMemo((): NavNodeId | null => {
    if (isVirtual()) return null;
    const fid = props.runtime.focusedNavId();
    if (!isVirtualNavId(fid)) return null;
    const src = sourceNavIdOfVirtual(fid);
    if (childIds().includes(src)) return src;
    return null;
  });

  const childVirtualsActive = (childId: NavNodeId) =>
    activeVirtualSource() === childId;

  return (
    <li
      role="treeitem"
      data-nav-id={props.navId}
      data-virtual={isVirtual() ? 'true' : undefined}
      aria-level={props.level}
      aria-posinset={props.posInSet}
      aria-setsize={props.setSize}
      aria-selected={focused() ? 'true' : 'false'}
      aria-expanded={ariaExpanded()}
      tabindex={focused() ? 0 : -1}
      class="olli-tree-item"
      classList={{ 'olli-focused': focused(), 'olli-virtual': isVirtual() }}
    >
      <NodeLabel runtime={props.runtime} navId={props.navId} />
      <Show when={showGroup()}>
        <ul role="group" class="olli-tree-group">
          <For each={childIds()}>
            {(childId, i) => {
              const virtuals = createMemo(() =>
                props.runtime.virtualOptionsFor(childId),
              );
              return (
                <Show when={!activeVirtualSource() || childVirtualsActive(childId)}>
                  <Show
                    when={!childVirtualsActive(childId)}
                    fallback={
                      <For each={virtuals()}>
                        {(vId, vi) => (
                          <TreeItem
                            runtime={props.runtime}
                            navId={vId}
                            level={props.level + 1}
                            posInSet={vi() + 1}
                            setSize={virtuals().length}
                          />
                        )}
                      </For>
                    }
                  >
                    <TreeItem
                      runtime={props.runtime}
                      navId={childId}
                      level={props.level + 1}
                      posInSet={i() + 1}
                      setSize={childIds().length}
                    />
                  </Show>
                </Show>
              );
            }}
          </For>
        </ul>
      </Show>
    </li>
  );
}
