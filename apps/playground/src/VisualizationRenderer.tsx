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
          (window as any).view = null;
          chartRef.innerHTML = '';
          treeRef.innerHTML = '';
        });

        (async () => {
          const [vega, vegaLite, utils, olliJs, olliAdapters] = await Promise.all([
            import('vega'),
            import('vega-lite'),
            import('@umwelt-data/umwelt-utils/vl-bridge'),
            import('olli'),
            import('olli/adapters'),
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
          (window as any).view = view;
          if (cancelled) return;

          // Enrich geoshape view data with geo fields so VL selection can test against them.
          // Vega tuples carry a Symbol-keyed ID; spreading copies it, causing the
          // changeset to treat enriched objects as duplicates (cancel remove + skip add).
          // Stripping symbols via Object.fromEntries(Object.entries(...)) ensures they
          // are ingested as fresh tuples.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const ds of (compiled as any).data ?? []) {
            if (!ds.name) continue;
            try {
              const rows = view.data(ds.name);
              if (rows?.length && olliJs.looksLikeFips(rows, 'id')) {
                const enriched = olliJs.enrichWithUSGeo(rows, 'id')
                  .map((d: Record<string, unknown>) => Object.fromEntries(Object.entries(d)));
                view.data(ds.name, enriched);
                await view.runAsync();
              }
            } catch { /* dataset may not be queryable */ }
          }

          const olliSpec = await olliAdapters.VegaLiteAdapter(props.example.spec);
          if (cancelled) return;

          handle = olliJs.olliVis(olliSpec, treeRef, { initialPreset: 'standard' });
          disposeBridge = utils.connectOlliToVegaLite(handle, view);
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
