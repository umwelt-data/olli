import type { OlliHandle } from 'olli';

export interface MountOptions {
  chartEl: HTMLElement;
  treeEl: HTMLElement;
  spec: any;
  renderer?: 'svg' | 'canvas';
}

export interface MountResult {
  view: any;
  handle: OlliHandle;
  destroy: () => void;
}

export async function mountVegaLiteExample(options: MountOptions): Promise<MountResult> {
  const { chartEl, treeEl, spec, renderer = 'svg' } = options;

  const [vega, vegaLite, utils, olliJs, olliAdapters] = await Promise.all([
    import('vega'),
    import('vega-lite'),
    import('@umwelt-data/umwelt-utils/vl-bridge'),
    import('olli'),
    import('olli/adapters'),
  ]);

  // normalize lets the bridge inject highlighting into composite marks
  // (boxplot, errorbar, errorband) by expanding them into plain layers first
  const injected = utils.withExternalStateParam(spec as any, { normalize: vegaLite.normalize });
  const compiled = vegaLite.compile(injected as any).spec;
  const runtime = vega.parse(compiled);

  const view = await new vega.View(runtime, { renderer })
    .initialize(chartEl)
    .runAsync();

  // Run vl-bridge data postprocessing (e.g. US-geo enrichment) on the view.
  await utils.postprocessViewData(view);

  const olliSpec = await olliAdapters.VegaLiteAdapter(spec);
  const handle = olliJs.olliVis(olliSpec, treeEl, { initialPreset: 'standard' });
  const disposeBridge = utils.connectOlliToVegaLite(handle, view);

  const destroy = () => {
    disposeBridge();
    handle.destroy();
    try { view.finalize(); } catch { /* ignore */ }
    chartEl.innerHTML = '';
    treeEl.innerHTML = '';
  };

  return { view, handle, destroy };
}
