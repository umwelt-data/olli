import { createRoot } from 'solid-js';
import { createNavigationRuntime, type Hypergraph } from 'olli-core';
import { mount, registerDefaultKeybindings } from 'olli-render-solid';
import { buildHandle, type OlliHandle, type OlliOptions } from './handle.js';
import { bridgeSignal } from './bridge.js';

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

    const destroy = () => {
      unmount();
      dispose();
    };
    handle = buildHandle(runtime, destroy, bridgeSignal);
  });

  return handle;
}
