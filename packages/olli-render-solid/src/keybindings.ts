import type { NavigationRuntime } from 'olli-core';
import { helpDialog } from './HelpDialog.jsx';

const registered = new WeakSet<object>();

export function registerDialogKeybindings<P>(
  runtime: NavigationRuntime<P>,
  onOpenDialog: (dialogId: string) => void,
): void {
  for (const dialog of runtime.dialogs.list()) {
    if (!dialog.triggerKey) continue;
    runtime.registerKeybinding({
      key: dialog.triggerKey,
      handler: () => {
        onOpenDialog(dialog.id);
        return true;
      },
    });
  }
}

export function registerDefaultKeybindings<P>(runtime: NavigationRuntime<P>): void {
  if (registered.has(runtime as unknown as object)) return;
  registered.add(runtime as unknown as object);

  runtime.registerDialog(helpDialog<P>());

  runtime.registerKeybinding({
    key: 'ArrowUp',
    label: 'Up one level',
    group: 'Navigation',
    handler: (rt) => {
      rt.moveFocus('up');
      return true;
    },
  });
  runtime.registerKeybinding({
    key: 'ArrowDown',
    label: 'Down one level',
    group: 'Navigation',
    handler: (rt) => {
      rt.moveFocus('down');
      return true;
    },
  });
  runtime.registerKeybinding({
    key: 'ArrowLeft',
    label: 'Previous item',
    group: 'Navigation',
    handler: (rt) => {
      rt.moveFocus('left');
      return true;
    },
  });
  runtime.registerKeybinding({
    key: 'ArrowRight',
    label: 'Next item',
    group: 'Navigation',
    handler: (rt) => {
      rt.moveFocus('right');
      return true;
    },
  });
  runtime.registerKeybinding({
    key: 'Home',
    label: 'First item on this level',
    group: 'Navigation',
    handler: (rt) => {
      rt.moveFocus('first');
      return true;
    },
  });
  runtime.registerKeybinding({
    key: 'End',
    label: 'Last item on this level',
    group: 'Navigation',
    handler: (rt) => {
      rt.moveFocus('last');
      return true;
    },
  });
  runtime.registerKeybinding({
    key: 'Enter',
    label: 'Down one level',
    group: 'Navigation',
    handler: (rt) => {
      rt.moveFocus('down');
      return true;
    },
  });
  runtime.registerKeybinding({
    key: ' ',
    label: 'Down one level',
    group: 'Navigation',
    handler: (rt) => {
      rt.moveFocus('down');
      return true;
    },
  });
  runtime.registerKeybinding({
    key: 'Escape',
    label: 'Up one level',
    group: 'Navigation',
    handler: (rt) => {
      rt.moveFocus('up');
      return true;
    },
  });
  runtime.registerKeybinding({
    key: 'o',
    label: 'Go to top level',
    group: 'Navigation',
    handler: (rt) => {
      const rootId = rt.navTree().roots[0];
      if (rootId) rt.focus(rootId);
      return true;
    },
  });
}
