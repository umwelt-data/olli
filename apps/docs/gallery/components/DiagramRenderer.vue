<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { DiagramExample } from '../examples/types.js';
import type { DiagramMountResult } from '../../../shared/mountDiagram.js';

const props = defineProps<{
  example: DiagramExample;
}>();

const chartContainer = ref<HTMLDivElement>();
const treeContainer = ref<HTMLDivElement>();

let result: DiagramMountResult | undefined;

async function mountDiagram() {
  if (!chartContainer.value || !treeContainer.value) return;

  const { mountDiagramExample } = await import('../../../shared/mountDiagram.js');

  result = await mountDiagramExample({
    chartEl: chartContainer.value,
    treeEl: treeContainer.value,
    example: props.example,
  });

  if (import.meta.env.DEV) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__olliGallery = { handle: result.handle, spec: props.example.spec };
  }
}

function teardown() {
  result?.destroy();
  result = undefined;
}

onMounted(() => void mountDiagram());
onBeforeUnmount(teardown);

watch(
  () => props.example.id,
  () => {
    teardown();
    void mountDiagram();
  },
);
</script>

<template>
  <div class="diagram-renderer">
    <div class="diagram-chart" role="img" :aria-label="props.example.title" >
      <div aria-hidden="true" ref="chartContainer"/>
    </div>
    <div ref="treeContainer" class="diagram-tree" />
  </div>
</template>

<style scoped>
.diagram-renderer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}
.diagram-chart,
.diagram-tree {
  min-height: 12rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 0.75rem;
  overflow: auto;
}
@media (max-width: 768px) {
  .diagram-renderer {
    grid-template-columns: 1fr;
  }
}
</style>
