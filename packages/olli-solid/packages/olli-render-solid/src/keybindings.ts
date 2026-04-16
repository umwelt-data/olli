import type { NavigationRuntime } from 'olli-core';

const registered = new WeakSet<object>();

export function registerDefaultKeybindings<P>(runtime: NavigationRuntime<P>): void {
  if (registered.has(runtime as unknown as object)) return;
  registered.add(runtime as unknown as object);

  runtime.registerKeybinding({
    key: 'ArrowUp',
    handler: (rt) => {
      rt.moveFocus('up');
      return true;
    },
  });
  runtime.registerKeybinding({
    key: 'ArrowDown',
    handler: (rt) => {
      rt.moveFocus('down');
      return true;
    },
  });
  runtime.registerKeybinding({
    key: 'ArrowLeft',
    handler: (rt) => {
      rt.moveFocus('left');
      return true;
    },
  });
  runtime.registerKeybinding({
    key: 'ArrowRight',
    handler: (rt) => {
      rt.moveFocus('right');
      return true;
    },
  });
  runtime.registerKeybinding({
    key: 'Enter',
    handler: (rt) => {
      const id = rt.focusedNavId();
      if (rt.expanded().has(id)) rt.collapse(id);
      else rt.expand(id);
      return true;
    },
  });
}
