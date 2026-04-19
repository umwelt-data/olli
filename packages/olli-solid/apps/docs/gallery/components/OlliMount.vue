<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { OlliHandle } from 'olli-js';

type OlliMountKind = 'vis' | 'diagram';

const props = defineProps<{
  /**
   * Which olli-js entry point to call. `vis` uses olliVis (for OlliVisSpec
   * inputs). `diagram` uses olliDiagram. Use the low-level `olli()` + a
   * pre-built hypergraph if neither fits.
   */
  kind: OlliMountKind;
  /** Spec passed to the chosen entry point. */
  spec: unknown;
  /** Optional preset name applied on mount. */
  initialPreset?: string;
}>();

const emit = defineEmits<{
  /** Fires once olli-js has mounted; gives callers a chance to wire the handle (e.g. connect a VL bridge). */
  ready: [handle: OlliHandle];
}>();

const container = ref<HTMLDivElement>();
let handle: OlliHandle | undefined;

async function mountOlli() {
  if (!container.value) return;

  // Dynamic import — olli-js is an ESM-only solid-js package; let VitePress
  // handle SSR-ineligibility by deferring the import to the client.
  const { olliVis, olliDiagram } = await import('olli-js');

  const options = props.initialPreset ? { initialPreset: props.initialPreset } : undefined;
  handle =
    props.kind === 'vis'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? olliVis(props.spec as any, container.value, options)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : olliDiagram(props.spec as any, container.value, options);

  emit('ready', handle);
}

function teardown() {
  handle?.destroy();
  handle = undefined;
  if (container.value) container.value.innerHTML = '';
}

onMounted(mountOlli);
onBeforeUnmount(teardown);

// Remount when the spec changes (e.g. navigating between examples reuses the component).
watch(
  () => [props.kind, props.spec],
  () => {
    teardown();
    void mountOlli();
  },
);
</script>

<template>
  <div ref="container" class="olli-mount" role="region" aria-label="Accessible tree view" />
</template>

<style scoped>
.olli-mount {
  min-height: 4rem;
}
</style>
