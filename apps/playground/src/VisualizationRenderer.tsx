import { createEffect, on, onCleanup } from 'solid-js';
import type { VisualizationExample } from '../../docs/gallery/examples/types.js';
import type { MountResult } from '../../shared/mountVegaLite.js';

export function VisualizationRenderer(props: { example: VisualizationExample }) {
  let chartRef!: HTMLDivElement;
  let treeRef!: HTMLDivElement;

  createEffect(
    on(
      () => props.example.id,
      () => {
        let result: MountResult | undefined;
        let cancelled = false;

        onCleanup(() => {
          cancelled = true;
          result?.destroy();
          (window as any).view = null;
        });

        (async () => {
          const { mountVegaLiteExample } = await import('../../shared/mountVegaLite.js');
          if (cancelled) return;

          result = await mountVegaLiteExample({
            chartEl: chartRef,
            treeEl: treeRef,
            spec: props.example.spec,
            renderer: 'svg',
          });
          if (cancelled) {
            result.destroy();
            result = undefined;
            return;
          }
          (window as any).view = result.view;
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
