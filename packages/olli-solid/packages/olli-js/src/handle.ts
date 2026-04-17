import type { NavigationRuntime, NavNodeId, Selection, Customization } from 'olli-core';

export interface OlliOptions {
  initialSelection?: Selection;
  initialCustomization?: Record<string, Customization>;
  initialPreset?: string;
  callbacks?: {
    onFocus?: (navId: NavNodeId) => void;
    onSelection?: (selection: Selection) => void;
  };
}

export interface OlliHandle {
  focus(navId: NavNodeId): void;
  getFocusedNavId(): NavNodeId;

  setSelection(selection: Selection): void;
  getSelection(): Selection;

  getDescription(navId: NavNodeId): string;

  setCustomization(role: string, customization: Customization): void;
  applyPreset(name: string): void;

  onFocusChange(cb: (navId: NavNodeId) => void): () => void;
  onSelectionChange(cb: (selection: Selection) => void): () => void;

  destroy(): void;
}

export function buildHandle<P>(
  runtime: NavigationRuntime<P>,
  dispose: () => void,
  bridge: <T>(read: () => T, cb: (value: T) => void) => () => void,
): OlliHandle {
  return {
    focus: (id) => runtime.focus(id),
    getFocusedNavId: () => runtime.focusedNavId(),
    setSelection: (s) => runtime.setSelection(s),
    getSelection: () => runtime.selection(),
    getDescription: (id) => runtime.getDescriptionFor(id)(),
    setCustomization: (r, c) => runtime.customization.setFor(r, c),
    applyPreset: (n) => runtime.customization.applyPreset(n),
    onFocusChange: (cb) => bridge(() => runtime.focusedNavId(), cb),
    onSelectionChange: (cb) => bridge(() => runtime.selection(), cb),
    destroy: () => dispose(),
  };
}
