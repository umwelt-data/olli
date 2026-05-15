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
          const [utils, olliJs] = await Promise.all([
            import('@umwelt-data/umwelt-utils'),
            import('olli'),
          ]);
          if (cancelled) return;

          const { svgElement, destroy } = await utils.mountBluefish(
            chartRef,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            props.example.children as any,
          );
          destroyMount = destroy;
          if (cancelled) { destroy(); return; }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          handle = olliJs.olliDiagram(props.example.spec as any, treeRef);
          disposeBridge = utils.createBluefishBridge({ handle, svgElement }).destroy;
        })();
      },
    ),
  );

  return (
    <div class="renderer-grid">
      <div ref={chartRef} class="panel" role="img" aria-label={props.example.title} />
      <div ref={treeRef} class="panel" />
    </div>
  );
}
