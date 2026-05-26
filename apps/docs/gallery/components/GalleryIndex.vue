<script setup lang="ts">
import { galleryGroups } from '../examples/groups.js';
import { withBase } from 'vitepress';
</script>

<template>
  <div class="gallery">
    <section v-for="group in galleryGroups" :key="group.label" class="gallery-group">
      <h2>{{ group.label }}</h2>
      <ul class="gallery-grid">
        <li v-for="ex in group.items" :key="ex.id">
          <a :href="withBase(`/gallery/${ex.id}/`)" class="gallery-card">
            <h3>{{ ex.title }}</h3>
          </a>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.gallery-group {
  margin-bottom: 2rem;
}
.gallery-group h2 {
  margin: 0 0 0.75rem;
  font-size: 1.2rem;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 0.5rem;
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
.vp-doc li + li {
  margin: 0;
}
</style>
