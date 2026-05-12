import type { VisualizationExample } from '../types.js';

export const scatterplot: VisualizationExample = {
  id: 'scatterplot',
  title: 'Scatterplot',
  domain: 'visualization',
  toolkit: 'vega-lite',
  tags: ['point', 'scatter', 'quantitative'],
  description: 'Penguin flipper length vs. body mass, colored and shaped by species.',
  spec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { url: 'https://raw.githubusercontent.com/vega/vega-datasets/next/data/penguins.json' },
    mark: 'point',
    encoding: {
      x: { field: 'Flipper Length (mm)', type: 'quantitative', scale: { zero: false } },
      y: { field: 'Body Mass (g)', type: 'quantitative', scale: { zero: false } },
      color: { field: 'Species', type: 'nominal' },
      shape: { field: 'Species', type: 'nominal' },
    },
  },
};
