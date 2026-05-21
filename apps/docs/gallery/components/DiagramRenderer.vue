<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { OlliHandle } from 'olli';
import type { DiagramExample } from '../examples/types.js';

const props = defineProps<{
  example: DiagramExample;
}>();

const chartContainer = ref<HTMLDivElement>();
const treeContainer = ref<HTMLDivElement>();

let destroyMount: (() => void) | undefined;
let handle: OlliHandle | undefined;
let disposeBridge: (() => void) | undefined;

async function mountDiagram() {
  if (!chartContainer.value || !treeContainer.value) return;

  const [{ render, elements }, { createBluefishBridge }, olliJs] = await Promise.all([
    props.example.children(),
    import('@umwelt-data/umwelt-utils/bluefish-bridge'),
    import('olli'),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  destroyMount = render(() => elements as any, chartContainer.value);
  const svgElement = chartContainer.value.querySelector('svg') as SVGSVGElement;

  handle = olliJs.olliDiagram(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props.example.spec as any,
    treeContainer.value,
  );

  disposeBridge = createBluefishBridge({ handle, svgElement }).destroy;

  if (import.meta.env.DEV) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__olliGallery = { handle, svgElement, spec: props.example.spec };
  }
}

function teardown() {
  disposeBridge?.();
  disposeBridge = undefined;
  handle?.destroy();
  handle = undefined;
  destroyMount?.();
  destroyMount = undefined;
  if (chartContainer.value) chartContainer.value.innerHTML = '';
  if (treeContainer.value) treeContainer.value.innerHTML = '';
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
