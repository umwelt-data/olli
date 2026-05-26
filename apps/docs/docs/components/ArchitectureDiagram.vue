<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { architectureDiagramSpec, renderBluefish } from './architecture-diagram.js';

const chartContainer = ref<HTMLDivElement>();
const treeContainer = ref<HTMLDivElement>();

let destroyMount: (() => void) | undefined;
let handle: import('olli').OlliHandle | undefined;
let disposeBridge: (() => void) | undefined;

async function mount() {
  if (!chartContainer.value || !treeContainer.value) return;

  const [{ render, elements }, { createBluefishBridge }, olli] = await Promise.all([
    renderBluefish(),
    import('@umwelt-data/umwelt-utils/bluefish-bridge'),
    import('olli'),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  destroyMount = render(() => elements as any, chartContainer.value);
  const svgElement = chartContainer.value.querySelector('svg') as SVGSVGElement;
  svgElement.style.maxWidth = '100%';
  svgElement.style.height = 'auto';

  const spec = { ...architectureDiagramSpec, title: 'Olli architecture', description: 'A pipeline that converts external visualization/diagram specs into accessible ARIA tree views' } as Parameters<typeof olli.olliDiagram>[0];
  handle = olli.olliDiagram(spec, treeContainer.value);

  disposeBridge = createBluefishBridge({ handle, svgElement }).destroy;
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

onMounted(() => void mount());
onBeforeUnmount(teardown);
</script>

<template>
  <div class="architecture-diagram">
    <div ref="chartContainer" class="architecture-chart" role="img" aria-label="Olli architecture diagram" />
    <div ref="treeContainer" class="architecture-tree" />
  </div>
</template>

<style scoped>
.architecture-diagram {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  align-items: start;
  margin: 1.5rem 0;
}

.architecture-chart,
.architecture-tree {
  min-height: 12rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 0.75rem;
  overflow: auto;
}

.architecture-chart {
  display: grid;
  place-items: center;
}
</style>