import { createEffect, on, onCleanup } from 'solid-js';
import type { OlliHandle } from 'olli';
import type { VisualizationExample } from '../../docs/gallery/examples/types.js';

export function VisualizationRenderer(props: { example: VisualizationExample }) {
  let chartRef!: HTMLDivElement;
  let treeRef!: HTMLDivElement;

  createEffect(
    on(
      () => props.example.id,
      () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let view: any;
        let handle: OlliHandle | undefined;
        let disposeBridge: (() => void) | undefined;
        let cancelled = false;

        onCleanup(() => {
          cancelled = true;
          disposeBridge?.();
          handle?.destroy();
          try {
            view?.finalize();
          } catch {
            /* ignore */
          }
          chartRef.innerHTML = '';
          treeRef.innerHTML = '';
        });

        (async () => {
          const [vega, vegaLite, utils, olliJs] = await Promise.all([
            import('vega'),
            import('vega-lite'),
            import('@umwelt-data/umwelt-utils'),
            import('olli'),
          ]);
          if (cancelled) return;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const injected = utils.withExternalStateParam(props.example.spec as any);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const compiled = vegaLite.compile(injected as any).spec;
          const runtime = vega.parse(compiled);

          view = await new vega.View(runtime, { renderer: 'svg' })
            .initialize(chartRef)
            .runAsync();
          if (cancelled) return;

          const olliSpec = await olliJs.VegaLiteAdapter(props.example.spec);
          if (cancelled) return;

          handle = olliJs.olliVis(olliSpec, treeRef, { initialPreset: 'standard' });
          disposeBridge = utils.connectOlliToVegaLite(handle, view);
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
