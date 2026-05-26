import { createRoot, createEffect, on } from 'solid-js';
import { createNavigationRuntime, registerDomain } from 'olli-core';
import type { Selection, NavigationRuntime, NavNodeId } from 'olli-core';
import type { OlliVisSpec, VisPayload } from 'olli-vis';
import { visDomain, elaborateSpec, lowerVisSpec, isMultiSpec } from 'olli-vis';
import { mount, registerDefaultKeybindings } from 'olli-render-solid';
import { buildHandle, type OlliHandle, type OlliOptions } from './handle.js';
import { bridgeSignal } from './bridge.js';
import { registerForJumpHotkey } from './globalJumpHotkey.js';

function applySelectionToSpec(spec: OlliVisSpec, sel: Selection): OlliVisSpec {
  const isEmpty = 'and' in sel && sel.and.length === 0;
  const selection: Selection | undefined = isEmpty ? undefined : sel;
  if (isMultiSpec(spec)) {
    return { ...spec, units: spec.units.map((u) => ({ ...u, selection } as typeof u)) };
  }
  return { ...spec, selection } as OlliVisSpec;
}

function findEquivalentNavId(
  runtime: NavigationRuntime<VisPayload>,
  oldPayload: VisPayload | null | undefined,
): NavNodeId {
  const tree = runtime.navTree();
  const root = tree.roots[0] ?? '';
  if (!oldPayload) return root;

  for (const [navId, node] of tree.byNavId) {
    if (!node.hyperedgeId) continue;
    const edge = runtime.getHyperedge(node.hyperedgeId);
    if (!edge?.payload) continue;
    const p = edge.payload;
    if (p.nodeType !== oldPayload.nodeType) continue;
    if (oldPayload.groupby && p.groupby === oldPayload.groupby) return navId;
    if (oldPayload.predicate && p.predicate) {
      if (p.predicate.field === oldPayload.predicate.field) {
        if ('equal' in p.predicate && 'equal' in oldPayload.predicate && p.predicate.equal === oldPayload.predicate.equal) {
          return navId;
        }
      }
    }
  }

  // If we had a groupby or predicate node but couldn't match it exactly, fall back to same nodeType
  for (const [navId, node] of tree.byNavId) {
    if (!node.hyperedgeId) continue;
    const edge = runtime.getHyperedge(node.hyperedgeId);
    if (edge?.payload?.nodeType === oldPayload.nodeType) return navId;
  }

  return root;
}

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
    runtime.customization.hydrateFromStorage();

    if (options?.initialSelection) {
      runtime.setSelection(options.initialSelection);
    }

    createEffect(on(
      () => runtime.selection(),
      (sel) => {
        const oldNavId = runtime.focusedNavId();
        const oldNode = runtime.getNavNode(oldNavId);
        const oldPayload = oldNode?.hyperedgeId
          ? runtime.getHyperedge(oldNode.hyperedgeId)?.payload
          : null;

        const updatedSpec = applySelectionToSpec(elaborated, sel);
        const newGraph = lowerVisSpec(updatedSpec);
        runtime.setHypergraph(newGraph);

        const newFocus = findEquivalentNavId(runtime, oldPayload);
        runtime.focus(newFocus);
      },
      { defer: true },
    ));

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

