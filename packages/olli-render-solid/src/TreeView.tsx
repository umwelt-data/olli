import { For, Show, ErrorBoundary, createEffect, createMemo, createSignal, type JSX } from 'solid-js';
import type { NavigationRuntime, NavNodeId, NavNode } from 'olli-core';
import { isVirtualNavId, sourceNavIdOfVirtual } from 'olli-core';
import { TreeItem } from './TreeItem.jsx';
import { Dialog } from './Dialog.jsx';
import { registerDefaultKeybindings, registerDialogKeybindings } from './keybindings.js';

export function TreeView<P>(props: { runtime: NavigationRuntime<P> }) {
  registerDefaultKeybindings(props.runtime);

  const [activeDialogId, setActiveDialogId] = createSignal<string | null>(null);
  const [dialogNavNode, setDialogNavNode] = createSignal<NavNode | null>(null);

  const openDialog = (dialogId: string) => {
    if (activeDialogId()) return;
    const navId = props.runtime.focusedNavId();
    const node = props.runtime.getNavNode(navId);
    if (!node) return;
    setDialogNavNode(node);
    setActiveDialogId(dialogId);
  };

  const closeDialog = () => {
    setActiveDialogId(null);
    setDialogNavNode(null);
    queueMicrotask(() => {
      const id = props.runtime.focusedNavId();
      const el = treeEl?.querySelector<HTMLElement>(
        `[data-nav-id="${CSS.escape(id)}"]`,
      );
      el?.focus();
    });
  };

  registerDialogKeybindings(props.runtime, openDialog);

  let treeEl: HTMLUListElement | undefined;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (activeDialogId()) return;
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

  const activeDialog = () => {
    const id = activeDialogId();
    if (!id) return null;
    const dialog = props.runtime.dialogs.byId(id);
    const node = dialogNavNode();
    if (!dialog?.render || !node) return null;
    return { dialog, node };
  };

  return (
    <>
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
        <Show when={activeContextRoot()} keyed>
          {(rootId) => (
            <TreeItem
              runtime={props.runtime}
              navId={rootId}
              level={1}
              posInSet={roots().length + 1}
              setSize={totalSetSize()}
            />
          )}
        </Show>
      </ul>
      <Show when={activeDialog()} keyed>
        {(active) => (
          <Dialog
            open={true}
            onClose={closeDialog}
            closeLabel={`Close ${active.dialog.label}`}
            titleId="olli-dialog-title"
          >
            <ErrorBoundary fallback={() => {
              queueMicrotask(closeDialog);
              return null;
            }}>
              {active.dialog.render!(props.runtime, active.node) as JSX.Element}
            </ErrorBoundary>
          </Dialog>
        )}
      </Show>
    </>
  );
}
