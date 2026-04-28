<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { OlliHandle } from 'olli-js';
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

  const [utils, olliJs] = await Promise.all([
    import('@umwelt-data/umwelt-utils'),
    import('olli-js'),
  ]);

  const { svgElement, scenegraph, destroy } = await utils.mountBluefish(
    chartContainer.value,
    props.example.children,
  );
  destroyMount = destroy;

  handle = olliJs.olliDiagram(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props.example.spec as any,
    treeContainer.value,
  );

  const bridge = utils.createBluefishBridge({ handle, scenegraph, svgElement });
  disposeBridge = bridge.destroy;

  if (import.meta.env.DEV) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__olliGallery = { handle, scenegraph, svgElement, spec: props.example.spec };
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
    <div ref="chartContainer" class="diagram-chart" role="img" :aria-label="props.example.title" />
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
