import type { VisualizationExample } from '../types.js';

export const stackedBarChart: VisualizationExample = {
  id: 'stacked-bar-chart',
  title: 'Stacked bar chart',
  domain: 'visualization',
  toolkit: 'vega-lite',
  tags: ['bar', 'stacked', 'aggregate'],
  description: 'Barley yield by variety, stacked by site.',
  spec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { url: 'https://raw.githubusercontent.com/vega/vega-datasets/next/data/barley.json' },
    mark: 'bar',
    encoding: {
      x: { aggregate: 'sum', field: 'yield' },
      y: { field: 'variety' },
      color: { field: 'site' },
    },
  },
};
