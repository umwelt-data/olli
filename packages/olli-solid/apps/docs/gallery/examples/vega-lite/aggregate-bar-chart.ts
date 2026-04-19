import type { VisualizationExample } from '../types.js';

export const aggregateBarChart: VisualizationExample = {
  id: 'aggregate-bar-chart',
  title: 'Aggregate bar chart',
  domain: 'visualization',
  toolkit: 'vega-lite',
  tags: ['bar', 'aggregate', 'temporal'],
  description: 'Mean precipitation per month in Seattle.',
  spec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { url: 'https://raw.githubusercontent.com/vega/vega-datasets/next/data/seattle-weather.csv' },
    mark: 'bar',
    encoding: {
      x: { timeUnit: 'month', field: 'date', type: 'ordinal' },
      y: { aggregate: 'mean', field: 'precipitation', type: 'quantitative' },
    },
  },
};
