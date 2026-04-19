<script setup lang="ts">
import { computed, ref } from 'vue';
import { examples } from '../examples/index.js';
import { withBase } from 'vitepress';

type DomainFilter = 'all' | 'visualization' | 'diagram';

const tagFilter = ref<string | null>(null);
const domainFilter = ref<DomainFilter>('all');

const allTags = computed(() => {
  const set = new Set<string>();
  for (const ex of examples) for (const t of ex.tags) set.add(t);
  return [...set].sort();
});

const filtered = computed(() => {
  return examples.filter((ex) => {
    if (domainFilter.value !== 'all' && ex.domain !== domainFilter.value) return false;
    if (tagFilter.value && !ex.tags.includes(tagFilter.value)) return false;
    return true;
  });
});

function toggleTag(t: string) {
  tagFilter.value = tagFilter.value === t ? null : t;
}
</script>

<template>
  <div class="gallery">
    <div class="gallery-filters">
      <fieldset class="gallery-domain">
        <legend>Domain</legend>
        <label v-for="d in ['all', 'visualization', 'diagram'] as const" :key="d">
          <input type="radio" :value="d" v-model="domainFilter" />
          <span>{{ d }}</span>
        </label>
      </fieldset>

      <fieldset class="gallery-tags" v-if="allTags.length">
        <legend>Tags</legend>
        <button
          v-for="t in allTags"
          :key="t"
          type="button"
          :class="{ 'is-active': tagFilter === t }"
          :aria-pressed="tagFilter === t"
          @click="toggleTag(t)"
        >
          {{ t }}
        </button>
      </fieldset>
    </div>

    <p v-if="!filtered.length" class="gallery-empty">No examples match the current filters.</p>

    <ul class="gallery-grid" v-else>
      <li v-for="ex in filtered" :key="ex.id">
        <a :href="withBase(`/gallery/${ex.id}/`)" class="gallery-card">
          <h3>{{ ex.title }}</h3>
          <p v-if="ex.description">{{ ex.description }}</p>
          <div class="gallery-card-meta">
            <span class="gallery-domain-badge">{{ ex.domain }}</span>
            <span v-for="t in ex.tags" :key="t" class="gallery-tag">{{ t }}</span>
          </div>
        </a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.gallery-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
fieldset {
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}
fieldset legend {
  padding: 0 0.35rem;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}
.gallery-tags button {
  font: inherit;
  border: 1px solid var(--vp-c-divider);
  background: transparent;
  color: var(--vp-c-text-1);
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  cursor: pointer;
}
.gallery-tags button.is-active {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  border-color: var(--vp-c-brand-1);
}
.gallery-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
  gap: 1rem;
}
.gallery-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.1s ease;
}
.gallery-card:hover {
  border-color: var(--vp-c-brand-1);
}
.gallery-card h3 {
  margin: 0;
  font-size: 1.05rem;
}
.gallery-card p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}
.gallery-card-meta {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-top: auto;
  padding-top: 0.25rem;
}
.gallery-domain-badge,
.gallery-tag {
  font-size: 0.75rem;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
}
.gallery-domain-badge {
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}
.gallery-empty {
  color: var(--vp-c-text-2);
  font-style: italic;
}
</style>
