<script setup lang="ts">
import type { DiagramExample } from '../examples/types.js';
import OlliMount from './OlliMount.vue';

defineProps<{
  example: DiagramExample;
}>();
</script>

<template>
  <div class="diag-renderer">
    <div class="diag-source" v-if="example.svg" v-html="example.svg" />
    <div class="diag-source diag-source--placeholder" v-else>
      <p>No source illustration provided.</p>
    </div>
    <OlliMount kind="diagram" :spec="example.spec" />
  </div>
</template>

<style scoped>
.diag-renderer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}
.diag-source {
  min-height: 12rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 0.75rem;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}
.diag-source--placeholder {
  color: var(--vp-c-text-2);
  font-style: italic;
}
@media (max-width: 768px) {
  .diag-renderer {
    grid-template-columns: 1fr;
  }
}
</style>
