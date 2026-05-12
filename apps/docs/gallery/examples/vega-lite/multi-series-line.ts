import type { VisualizationExample } from '../types.js';

export const multiSeriesLine: VisualizationExample = {
  id: 'multi-series-line',
  title: 'Multi-series line chart',
  domain: 'visualization',
  toolkit: 'vega-lite',
  tags: ['line', 'temporal', 'multi-series'],
  description: 'Stock prices of five tech companies over time.',
  spec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Stock prices of 5 tech companies over time.',
    data: { url: 'https://raw.githubusercontent.com/vega/vega-datasets/next/data/stocks.csv' },
    mark: 'line',
    config: { legend: { disable: true } },
    encoding: {
      x: { field: 'date', type: 'temporal' },
      y: { field: 'price', type: 'quantitative' },
      color: { field: 'symbol', type: 'nominal' },
    },
  },
};
