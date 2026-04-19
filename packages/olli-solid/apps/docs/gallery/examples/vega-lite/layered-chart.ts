import type { VisualizationExample } from '../types.js';

export const layeredChart: VisualizationExample = {
  id: 'layered-chart',
  title: 'Layered chart',
  domain: 'visualization',
  toolkit: 'vega-lite',
  tags: ['layer', 'multi-view', 'temporal'],
  description: 'Google stock prices with raw points and a yearly mean line overlaid.',
  spec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Plot showing average data with raw values in the background.',
    data: { url: 'https://raw.githubusercontent.com/vega/vega-datasets/next/data/stocks.csv' },
    transform: [{ filter: "datum.symbol==='GOOG'" }],
    layer: [
      {
        mark: { type: 'point', opacity: 0.3 },
        encoding: {
          x: { timeUnit: 'year', field: 'date' },
          y: { field: 'price', type: 'quantitative' },
        },
      },
      {
        mark: 'line',
        encoding: {
          x: { timeUnit: 'year', field: 'date' },
          y: { aggregate: 'mean', field: 'price' },
        },
      },
    ],
  },
};
