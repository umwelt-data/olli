import { createNavigationRuntime, registerDomain, type NavigationRuntime } from 'olli-core';
import { diagramDomain, pulleyMedium, type DiagramPayload } from 'olli-diagram';
import { mount } from 'olli-render-solid';

/**
 * Build a NavigationRuntime from the medium pulley spec and mount the
 * accessible tree into `container`. Returns the runtime plus a disposer.
 */
export function mountPulleyMedium(container: HTMLElement): {
  runtime: NavigationRuntime<DiagramPayload>;
  dispose: () => void;
} {
  const graph = diagramDomain.toHypergraph(pulleyMedium);
  const runtime = createNavigationRuntime(graph);
  registerDomain(runtime, diagramDomain);
  const dispose = mount(runtime, container);
  return { runtime, dispose };
}
