import { createEffect, on, onCleanup } from 'solid-js';
import type { OlliHandle } from 'olli';
import type { DiagramExample } from '../../docs/gallery/examples/types.js';

export function DiagramRenderer(props: { example: DiagramExample }) {
  let chartRef!: HTMLDivElement;
  let treeRef!: HTMLDivElement;

  createEffect(
    on(
      () => props.example.id,
      () => {
        let destroyMount: (() => void) | undefined;
        let handle: OlliHandle | undefined;
        let disposeBridge: (() => void) | undefined;
        let cancelled = false;

        onCleanup(() => {
          cancelled = true;
          disposeBridge?.();
          handle?.destroy();
          destroyMount?.();
          chartRef.innerHTML = '';
          treeRef.innerHTML = '';
        });

        (async () => {
          const [{ render, elements }, { createBluefishBridge }, olliJs] = await Promise.all([
            props.example.children(),
            import('@umwelt-data/umwelt-utils/bluefish-bridge'),
            import('olli'),
          ]);
          if (cancelled) return;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          destroyMount = render(() => elements as any, chartRef);
          const svgElement = chartRef.querySelector('svg') as SVGSVGElement;
          if (cancelled) { destroyMount(); return; }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          handle = olliJs.olliDiagram(props.example.spec as any, treeRef);
          disposeBridge = createBluefishBridge({ handle, svgElement }).destroy;
        })();
      },
    ),
  );

  return (
    <div class="renderer-grid">
      <div class="panel" role="img" aria-label={props.example.title}>
        <div aria-hidden="true" ref={chartRef} />
      </div>
      <div ref={treeRef} class="panel" />
    </div>
  );
}
