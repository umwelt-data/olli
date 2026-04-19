import type { VisualizationExample } from '../types.js';

export const concatChart: VisualizationExample = {
  id: 'concat-chart',
  title: 'Concatenated chart',
  domain: 'visualization',
  toolkit: 'vega-lite',
  tags: ['concat', 'multi-view'],
  description: 'A Seattle precipitation histogram stacked above a temperature scatterplot.',
  spec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Two vertically concatenated charts that show a histogram of precipitation in Seattle and the relationship between min and max temperature.',
    data: { url: 'https://raw.githubusercontent.com/vega/vega-datasets/next/data/weather.csv' },
    transform: [{ filter: "datum.location === 'Seattle'" }],
    vconcat: [
      {
        mark: 'bar',
        encoding: {
          x: { timeUnit: 'month', field: 'date', type: 'ordinal' },
          y: { aggregate: 'mean', field: 'precipitation', type: 'quantitative' },
        },
      },
      {
        mark: 'point',
        encoding: {
          x: { field: 'temp_min', type: 'quantitative', bin: true },
          y: { field: 'temp_max', type: 'quantitative', bin: true },
          size: { aggregate: 'count', type: 'quantitative' },
        },
      },
    ],
  },
};
