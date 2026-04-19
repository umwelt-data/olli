import type { VisualizationExample } from '../types.js';

export const groupedBarChart: VisualizationExample = {
  id: 'grouped-bar-chart',
  title: 'Grouped bar chart',
  domain: 'visualization',
  toolkit: 'vega-lite',
  tags: ['bar', 'grouped', 'categorical'],
  description: 'A bar chart split into groups by a nominal field.',
  spec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: [
        { category: 'A', group: 'x', value: 0.1 },
        { category: 'A', group: 'y', value: 0.6 },
        { category: 'A', group: 'z', value: 0.9 },
        { category: 'B', group: 'x', value: 0.7 },
        { category: 'B', group: 'y', value: 0.2 },
        { category: 'B', group: 'z', value: 1.1 },
        { category: 'C', group: 'x', value: 0.6 },
        { category: 'C', group: 'y', value: 0.1 },
        { category: 'C', group: 'z', value: 0.2 },
      ],
    },
    mark: 'bar',
    encoding: {
      x: { field: 'category' },
      y: { field: 'value', type: 'quantitative' },
      xOffset: { field: 'group' },
      color: { field: 'group' },
    },
  },
};
