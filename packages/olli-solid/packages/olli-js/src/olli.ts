import { createRoot } from 'solid-js';
import { createNavigationRuntime, type Hypergraph } from 'olli-core';
import { mount, registerDefaultKeybindings } from 'olli-render-solid';
import { buildHandle, type OlliHandle, type OlliOptions } from './handle.js';
import { bridgeSignal } from './bridge.js';
import { registerForJumpHotkey } from './globalJumpHotkey.js';

/**
 * Render an accessible tree view of an {@link Hypergraph} into the given container.
 *
 * Returns an {@link OlliHandle} you can use to drive focus, read or set the
 * current selection, subscribe to changes, and ultimately tear the view down.
 *
 * @example
 * ```ts
 * const handle = olli(graph, document.getElementById('tree')!);
 * handle.onSelectionChange((sel) => console.log('olli selection:', sel));
 * ```
 */
export function olli<P = unknown>(
  graph: Hypergraph<P>,
  container: HTMLElement,
  options?: OlliOptions,
): OlliHandle {
  let dispose!: () => void;
  let handle!: OlliHandle;

  createRoot((d) => {
    dispose = d;

    const runtime = createNavigationRuntime<P>(graph);
    registerDefaultKeybindings(runtime);

    if (options?.initialPreset) {
      runtime.customization.applyPreset(options.initialPreset);
    }
    if (options?.initialCustomization) {
      for (const [role, c] of Object.entries(options.initialCustomization)) {
        runtime.customization.setFor(role, c);
      }
    }
    if (options?.initialSelection) {
      runtime.setSelection(options.initialSelection);
    }

    const unmount = mount(runtime, container);

    if (options?.callbacks?.onFocus) {
      const cb = options.callbacks.onFocus;
      bridgeSignal(() => runtime.focusedNavId(), cb);
    }
    if (options?.callbacks?.onSelection) {
      const cb = options.callbacks.onSelection;
      bridgeSignal(() => runtime.selection(), cb);
    }

    let unregisterHotkey: (() => void) | undefined;
    const destroy = () => {
      unregisterHotkey?.();
      unmount();
      dispose();
    };
    handle = buildHandle(runtime, destroy, bridgeSignal);
    unregisterHotkey = registerForJumpHotkey(container, handle);
  });

  return handle;
}
