import { createRoot } from 'solid-js';
import { createNavigationRuntime, registerDomain } from 'olli-core';
import type { DiagramSpec, DiagramPayload } from 'olli-diagram';
import { diagramDomain } from 'olli-diagram';
import { mount, registerDefaultKeybindings } from 'olli-render-solid';
import { buildHandle, type OlliHandle, type OlliOptions } from './handle.js';
import { bridgeSignal } from './bridge.js';

export function olliDiagram(
  spec: DiagramSpec,
  container: HTMLElement,
  options?: OlliOptions,
): OlliHandle {
  let dispose!: () => void;
  let handle!: OlliHandle;

  createRoot((d) => {
    dispose = d;

    const graph = diagramDomain.toHypergraph(spec);
    const runtime = createNavigationRuntime<DiagramPayload>(graph);

    registerDomain(runtime, diagramDomain);
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
