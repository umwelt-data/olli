<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { OlliHandle } from 'olli';
import type { VisualizationExample } from '../examples/types.js';

const props = defineProps<{
  example: VisualizationExample;
}>();

const chartContainer = ref<HTMLDivElement>();
const treeContainer = ref<HTMLDivElement>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let view: any;
let handle: OlliHandle | undefined;
let disposeBridge: (() => void) | undefined;

async function mountVegaLite() {
  if (!chartContainer.value || !treeContainer.value) return;

  const [vega, vegaLite, utils, olliJs] = await Promise.all([
    import('vega'),
    import('vega-lite'),
    import('@umwelt-data/umwelt-utils/vl-bridge'),
    import('olli'),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const injected = utils.withExternalStateParam(props.example.spec as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compiled = vegaLite.compile(injected as any).spec;
  const runtime = vega.parse(compiled);

  view = await new vega.View(runtime, { renderer: 'canvas' })
    .initialize(chartContainer.value)
    .runAsync();

  // olli's VegaLiteAdapter compiles and spins up its own view internally
  // to scrape the rendered scenegraph for data. We pass the same injected
  // spec so extracted predicates align with the one the user sees.
  const olliSpec = await olliJs.VegaLiteAdapter(injected);
  handle = olliJs.olliVis(olliSpec, treeContainer.value, { initialPreset: 'standard' });

  disposeBridge = utils.connectOlliToVegaLite(handle, view);

  if (import.meta.env.DEV) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__olliGallery = { view, handle, spec: injected };
  }
}

function teardown() {
  disposeBridge?.();
  disposeBridge = undefined;
  handle?.destroy();
  handle = undefined;
  try {
    view?.finalize();
  } catch {
    /* ignore */
  }
  view = undefined;
  if (chartContainer.value) chartContainer.value.innerHTML = '';
  if (treeContainer.value) treeContainer.value.innerHTML = '';
}

onMounted(() => void mountVegaLite());
onBeforeUnmount(teardown);

watch(
  () => props.example.id,
  () => {
    teardown();
    void mountVegaLite();
  },
);
</script>

<template>
  <div class="viz-renderer">
    <div class="viz-chart" role="img" :aria-label="props.example.title">
      <div aria-hidden="true" ref="chartContainer" />
    </div>
    <div ref="treeContainer" class="viz-tree" />
  </div>
</template>

<style scoped>
.viz-renderer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}
.viz-chart,
.viz-tree {
  min-height: 12rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 0.75rem;
  overflow: auto;
}
@media (max-width: 768px) {
  .viz-renderer {
    grid-template-columns: 1fr;
  }
}
</style>
