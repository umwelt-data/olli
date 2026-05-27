import { createEffect, on, onCleanup } from 'solid-js';
import type { DiagramExample } from '../../docs/gallery/examples/types.js';
import type { DiagramMountResult } from '../../shared/mountDiagram.js';

export function DiagramRenderer(props: { example: DiagramExample }) {
  let chartRef!: HTMLDivElement;
  let treeRef!: HTMLDivElement;

  createEffect(
    on(
      () => props.example.id,
      () => {
        let result: DiagramMountResult | undefined;
        let cancelled = false;

        onCleanup(() => {
          cancelled = true;
          result?.destroy();
        });

        (async () => {
          const { mountDiagramExample } = await import('../../shared/mountDiagram.js');
          if (cancelled) return;

          result = await mountDiagramExample({
            chartEl: chartRef,
            treeEl: treeRef,
            example: props.example,
          });
          if (cancelled) {
            result.destroy();
            result = undefined;
          }
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
