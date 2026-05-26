<script setup lang="ts">
import { computed } from 'vue';
import type { GalleryExample } from '../examples/types.js';

const props = defineProps<{
  example: GalleryExample;
}>();

const bluefishSources: Record<string, string> = import.meta.glob(
  ['../examples/bluefish/*.ts', '!**/*.d.ts'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

function stripGalleryHidden(raw: string): string {
  return raw
    .replace(/\/\/ @gallery-hide-start[\s\S]*?\/\/ @gallery-hide-end\n?/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function findBluefishSource(id: string): string | undefined {
  for (const [path, source] of Object.entries(bluefishSources)) {
    const filename = path.split('/').pop()?.replace('.ts', '');
    if (filename === id) return stripGalleryHidden(source);
  }
  return undefined;
}

const specCode = computed(() => {
  if (props.example.domain === 'visualization') {
    return {
      lang: 'json',
      code: JSON.stringify(props.example.spec, null, 2),
    };
  }
  const source = findBluefishSource(props.example.id);
  return {
    lang: 'ts',
    code: source ?? '// Source not available',
  };
});

const usageCode = computed(() => {
  if (props.example.domain === 'visualization') {
    return `import { olliVis } from 'olli';
import { VegaLiteAdapter } from 'olli/adapters';

// vlSpec is your Vega-Lite specification (shown above)
const olliSpec = await VegaLiteAdapter(vlSpec);
olliVis(olliSpec, document.getElementById('olli-tree'));`;
  }
  return `import { olliDiagram } from 'olli';
import { BluefishAdapter } from 'olli/adapters';

// mySpecFn is your Bluefish specification (shown above)
const spec = BluefishAdapter(mySpecFn);
olliDiagram(spec, document.getElementById('olli-tree'));`;
});
</script>

<template>
  <details class="code-display">
    <summary>Spec &amp; Code</summary>
    <div class="code-sections">
      <section>
        <h3>Spec</h3>
        <pre class="code-block"><code>{{ specCode.code }}</code></pre>
      </section>
      <section>
        <h3>Usage</h3>
        <pre class="code-block"><code>{{ usageCode }}</code></pre>
      </section>
    </div>
  </details>
</template>

<style scoped>
.code-display {
  margin-top: 1.5rem;
}

.code-display summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--vp-c-text-1);
  padding: 0.5rem 0;
  user-select: none;
}

.code-sections {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.5rem;
}

.code-sections h3 {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.code-block {
  background: var(--vp-code-block-bg);
  color: var(--vp-code-block-color);
  border-radius: 6px;
  padding: 1rem;
  overflow: auto;
  font-size: var(--vp-code-font-size);
  line-height: var(--vp-code-line-height);
  max-height: 24rem;
}

.code-block code {
  font-family: var(--vp-font-family-mono);
  white-space: pre;
}
</style>
