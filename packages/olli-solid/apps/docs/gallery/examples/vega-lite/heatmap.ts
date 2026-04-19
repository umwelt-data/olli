import type { VisualizationExample } from '../types.js';

export const heatmap: VisualizationExample = {
  id: 'heatmap',
  title: 'Heatmap',
  domain: 'visualization',
  toolkit: 'vega-lite',
  tags: ['heatmap', 'temporal'],
  description: 'Daily max temperatures in Seattle, as a month-by-day heatmap.',
  spec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    title: 'Daily Max Temperatures (C) in Seattle, WA',
    data: { url: 'https://raw.githubusercontent.com/vega/vega-datasets/next/data/seattle-weather.csv' },
    config: {
      view: { strokeWidth: 0, step: 13 },
      axis: { domain: false },
    },
    mark: 'rect',
    encoding: {
      x: {
        field: 'date',
        timeUnit: 'date',
        type: 'ordinal',
        title: 'Day',
        axis: { labelAngle: 0, format: '%e' },
      },
      y: {
        field: 'date',
        timeUnit: 'month',
        type: 'ordinal',
        title: 'Month',
      },
      color: {
        field: 'temp_max',
        aggregate: 'max',
        type: 'quantitative',
        legend: { title: null },
      },
    },
  },
};
