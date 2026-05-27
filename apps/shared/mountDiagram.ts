import type { OlliHandle } from 'olli';
import type { DiagramExample } from '../docs/gallery/examples/types.js';

export interface DiagramMountOptions {
  chartEl: HTMLElement;
  treeEl: HTMLElement;
  example: DiagramExample;
}

export interface DiagramMountResult {
  handle: OlliHandle;
  destroy: () => void;
}

export async function mountDiagramExample(options: DiagramMountOptions): Promise<DiagramMountResult> {
  const { chartEl, treeEl, example } = options;

  const [{ render, elements }, { createBluefishBridge }, olliJs] = await Promise.all([
    example.children(),
    import('@umwelt-data/umwelt-utils/bluefish-bridge'),
    import('olli'),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const destroyMount = render(() => elements as any, chartEl);
  const svgElement = chartEl.querySelector('svg') as SVGSVGElement;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handle = olliJs.olliDiagram(example.spec as any, treeEl);
  const disposeBridge = createBluefishBridge({ handle, svgElement }).destroy;

  const destroy = () => {
    disposeBridge();
    handle.destroy();
    destroyMount();
    chartEl.innerHTML = '';
    treeEl.innerHTML = '';
  };

  return { handle, destroy };
}
