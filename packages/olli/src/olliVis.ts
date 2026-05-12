import { createRoot } from 'solid-js';
import { createNavigationRuntime, registerDomain } from 'olli-core';
import type { OlliVisSpec, VisPayload } from 'olli-vis';
import { visDomain, elaborateSpec, lowerVisSpec } from 'olli-vis';
import { mount, registerDefaultKeybindings } from 'olli-render-solid';
import { buildHandle, type OlliHandle, type OlliOptions } from './handle.js';
import { bridgeSignal } from './bridge.js';
import { registerForJumpHotkey } from './globalJumpHotkey.js';

export function olliVis(
  spec: OlliVisSpec,
  container: HTMLElement,
  options?: OlliOptions,
): OlliHandle {
  let dispose!: () => void;
  let handle!: OlliHandle;

  createRoot((d) => {
    dispose = d;

    const elaborated = elaborateSpec(spec);
    const graph = lowerVisSpec(elaborated);
    const runtime = createNavigationRuntime<VisPayload>(graph);

    registerDomain(runtime, visDomain);
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

