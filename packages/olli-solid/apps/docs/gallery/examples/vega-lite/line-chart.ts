import type { VisualizationExample } from '../types.js';

export const lineChart: VisualizationExample = {
  id: 'line-chart',
  title: 'Line chart',
  domain: 'visualization',
  toolkit: 'vega-lite',
  tags: ['line', 'temporal'],
  description: "Google's stock price over time.",
  spec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: "Google's stock price over time.",
    data: { url: 'https://raw.githubusercontent.com/vega/vega-datasets/next/data/stocks.csv' },
    transform: [{ filter: "datum.symbol==='GOOG'" }],
    mark: 'line',
    encoding: {
      x: { field: 'date', type: 'temporal' },
      y: { field: 'price', type: 'quantitative' },
    },
  },
};
