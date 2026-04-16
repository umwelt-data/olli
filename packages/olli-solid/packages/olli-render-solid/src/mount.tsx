import { render } from 'solid-js/web';
import type { NavigationRuntime } from 'olli-core';
import { TreeView } from './TreeView.jsx';

export interface MountOptions {
  /** Reserved for future use. */
  readonly _?: never;
}

export function mount<P>(
  runtime: NavigationRuntime<P>,
  container: HTMLElement,
  _options?: MountOptions,
): () => void {
  return render(() => <TreeView runtime={runtime} />, container);
}
