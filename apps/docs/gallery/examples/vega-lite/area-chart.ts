import type { VisualizationExample } from '../types.js';

export const areaChart: VisualizationExample = {
  id: 'area-chart',
  title: 'Area chart',
  domain: 'visualization',
  toolkit: 'vega-lite',
  tags: ['area', 'temporal', 'aggregate'],
  description: 'Unemployment across industries, summed over time.',
  spec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Unemployment across industries.',
    data: { url: 'https://raw.githubusercontent.com/vega/vega-datasets/next/data/unemployment-across-industries.json' },
    mark: 'area',
    encoding: {
      x: { timeUnit: 'yearmonth', field: 'date', axis: { format: '%Y' } },
      y: { aggregate: 'sum', field: 'count', title: 'count' },
    },
  },
};
