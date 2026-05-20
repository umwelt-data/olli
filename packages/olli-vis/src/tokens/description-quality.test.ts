import { describe, it, expect } from 'vitest';
import { createRoot } from 'solid-js';
import { createNavigationRuntime, registerDomain } from 'olli-core';
import { visDomain } from '../domain.js';
import { lowerVisSpec } from '../lower/lower.js';
import type { UnitOlliVisSpec, OlliDataset, VisPayload } from '../spec/types.js';

const sampleData: OlliDataset = [
  { category: 'A', value: 10 },
  { category: 'B', value: 20 },
  { category: 'C', value: 30 },
];

const barChartSpec: UnitOlliVisSpec = {
  data: sampleData,
  mark: 'bar',
  title: 'Sales by Category',
  fields: [
    { field: 'category', type: 'nominal' },
    { field: 'value', type: 'quantitative' },
  ],
  axes: [
    { field: 'category', axisType: 'x', title: 'Category' },
    { field: 'value', axisType: 'y', title: 'Value' },
  ],
  structure: [
    { groupby: 'category' },
    { groupby: 'value' },
  ],
};

const scatterplotSpec: UnitOlliVisSpec = {
  data: [
    { height: 170, weight: 65 },
    { height: 180, weight: 75 },
    { height: 160, weight: 55 },
  ],
  mark: 'point',
  title: 'Height vs Weight',
  fields: [
    { field: 'height', type: 'quantitative' },
    { field: 'weight', type: 'quantitative' },
  ],
  axes: [
    { field: 'height', axisType: 'x', title: 'Height' },
    { field: 'weight', axisType: 'y', title: 'Weight' },
  ],
  structure: [
    { groupby: 'height' },
  ],
};

const lineChartSpec: UnitOlliVisSpec = {
  data: [
    { year: '2020-01-01', sales: 100 },
    { year: '2021-01-01', sales: 150 },
    { year: '2022-01-01', sales: 200 },
  ],
  mark: 'line',
  title: 'Annual Sales',
  fields: [
    { field: 'year', type: 'temporal' },
    { field: 'sales', type: 'quantitative' },
  ],
  axes: [
    { field: 'year', axisType: 'x', title: 'Year' },
    { field: 'sales', axisType: 'y', title: 'Sales' },
  ],
  structure: [
    { groupby: 'year' },
  ],
};

const barChartWithDescription: UnitOlliVisSpec = {
  ...barChartSpec,
  description: 'A chart about sales',
};

const specs = [
  { name: 'bar chart', spec: barChartSpec },
  { name: 'scatterplot', spec: scatterplotSpec },
  { name: 'line chart', spec: lineChartSpec },
  { name: 'bar chart with description', spec: barChartWithDescription },
];

const presets = ['detailed', 'standard', 'minimal'] as const;

function collectAllDescriptions(spec: UnitOlliVisSpec, preset: string): { navId: string; desc: string }[] {
  const results: { navId: string; desc: string }[] = [];
  createRoot((dispose) => {
    const graph = lowerVisSpec(spec);
    const runtime = createNavigationRuntime<VisPayload>(graph);
    registerDomain(runtime, visDomain);
    runtime.customization.applyPreset(preset);

    function walk(navId: string) {
      const desc = runtime.getDescriptionFor(navId)();
      results.push({ navId, desc });
      const node = runtime.getNavNode(navId);
      if (node) {
        for (const childId of node.childNavIds) {
          walk(childId);
        }
      }
    }

    const roots = runtime.navTree().roots;
    for (const rootId of roots) {
      walk(rootId);
    }
    dispose();
  });
  return results;
}

describe('spec.description sentence boundary', () => {
  it('description is followed by a sentence break, not a comma', () => {
    const descriptions = collectAllDescriptions(barChartWithDescription, 'detailed');
    const root = descriptions[0]!;
    expect(root.desc).toMatch(/A chart about sales\.\s+A\s/);
    expect(root.desc).not.toMatch(/A chart about sales,/);
  });
});

describe('description quality invariants', () => {
  for (const { name, spec } of specs) {
    for (const preset of presets) {
      const label = `${name} / ${preset}`;

      it(`${label}: no double periods`, () => {
        const descriptions = collectAllDescriptions(spec, preset);
        for (const { navId, desc } of descriptions) {
          expect(desc, `navId=${navId}`).not.toContain('..');
        }
      });

      it(`${label}: no leading or trailing whitespace`, () => {
        const descriptions = collectAllDescriptions(spec, preset);
        for (const { navId, desc } of descriptions) {
          expect(desc, `navId=${navId}`).toBe(desc.trim());
        }
      });

      it(`${label}: starts with uppercase or backtick-wrapped literal if non-empty`, () => {
        const descriptions = collectAllDescriptions(spec, preset);
        for (const { navId, desc } of descriptions) {
          if (desc.length === 0) continue;
          if (desc.startsWith('`')) continue;
          const firstAlpha = desc.match(/[a-zA-Z]/);
          if (firstAlpha) {
            expect(firstAlpha[0], `navId=${navId}, desc="${desc}"`).toBe(firstAlpha[0].toUpperCase());
          }
        }
      });

      it(`${label}: ends with exactly one period if non-empty`, () => {
        const descriptions = collectAllDescriptions(spec, preset);
        for (const { navId, desc } of descriptions) {
          if (desc.length === 0) continue;
          expect(desc, `navId=${navId}`).toMatch(/[^.]\.$/);
        }
      });

      it(`${label}: no stray comma patterns`, () => {
        const descriptions = collectAllDescriptions(spec, preset);
        for (const { navId, desc } of descriptions) {
          expect(desc, `navId=${navId}`).not.toMatch(/,\s*,/);
          expect(desc, `navId=${navId}`).not.toMatch(/\.\s*,/);
          expect(desc, `navId=${navId}`).not.toMatch(/,\s*\./);
        }
      });

      it(`${label}: balanced backtick markers`, () => {
        const descriptions = collectAllDescriptions(spec, preset);
        for (const { navId, desc } of descriptions) {
          const backtickCount = (desc.match(/`/g) ?? []).length;
          expect(backtickCount % 2, `navId=${navId}, desc="${desc}"`).toBe(0);
        }
      });
    }
  }
});
