<script setup lang="ts">
import { computed } from 'vue';
import { findExample } from '../examples/index.js';
import VisualizationRenderer from './VisualizationRenderer.vue';
import DiagramRenderer from './DiagramRenderer.vue';
import CodeDisplay from './CodeDisplay.vue';

const props = defineProps<{
  /** URL slug from the dynamic route. */
  id: string;
}>();

const example = computed(() => findExample(props.id));
</script>

<template>
  <article v-if="example">
    <header class="ex-header">
      <h1>{{ example.title }}</h1>
      <p v-if="example.description" class="ex-description">{{ example.description }}</p>
    </header>

    <VisualizationRenderer v-if="example.domain === 'visualization'" :example="example" />
    <DiagramRenderer v-else-if="example.domain === 'diagram'" :example="example" />

    <CodeDisplay :example="example" />
  </article>

  <article v-else>
    <h1>Example not found</h1>
    <p>
      No example is registered with id <code>{{ props.id }}</code
      >. Return to the <a href="/olli/gallery/">gallery index</a>.
    </p>
  </article>
</template>

<style scoped>
.ex-header {
  margin-bottom: 1.5rem;
}
.ex-description {
  color: var(--vp-c-text-2);
  margin-top: 0.25rem;
}
</style>
