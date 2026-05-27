<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { VisualizationExample } from '../examples/types.js';
import type { MountResult } from '../../../shared/mountVegaLite.js';

const props = defineProps<{
  example: VisualizationExample;
}>();

const chartContainer = ref<HTMLDivElement>();
const treeContainer = ref<HTMLDivElement>();

let result: MountResult | undefined;

async function mountVegaLite() {
  if (!chartContainer.value || !treeContainer.value) return;

  const { mountVegaLiteExample } = await import('../../../shared/mountVegaLite.js');

  result = await mountVegaLiteExample({
    chartEl: chartContainer.value,
    treeEl: treeContainer.value,
    spec: props.example.spec,
    renderer: 'canvas',
  });

  if (import.meta.env.DEV) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__olliGallery = { view: result.view, handle: result.handle, spec: props.example.spec };
  }
}

function teardown() {
  result?.destroy();
  result = undefined;
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
