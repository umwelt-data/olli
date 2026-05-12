import type { VisualizationExample } from '../types.js';

export const lasagnaPlot: VisualizationExample = {
  id: 'lasagna-plot',
  title: 'Lasagna plot',
  domain: 'visualization',
  toolkit: 'vega-lite',
  tags: ['heatmap', 'temporal', 'multi-series'],
  description: 'Stock prices as a time-by-symbol lasagna plot.',
  spec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { url: 'https://raw.githubusercontent.com/vega/vega-datasets/next/data/stocks.csv' },
    width: 300,
    height: 100,
    mark: 'rect',
    transform: [{ filter: "datum.symbol !== 'GOOG'" }],
    encoding: {
      x: {
        timeUnit: 'yearmonthdate',
        field: 'date',
        type: 'ordinal',
        title: 'Time',
        axis: {
          format: '%Y',
          labelAngle: 0,
          labelOverlap: false,
          labelColor: {
            condition: {
              test: { timeUnit: 'monthdate', field: 'value', equal: { month: 1, date: 1 } },
              value: 'black',
            },
            value: null,
          },
          tickColor: {
            condition: {
              test: { timeUnit: 'monthdate', field: 'value', equal: { month: 1, date: 1 } },
              value: 'black',
            },
            value: null,
          },
        },
      },
      y: { field: 'symbol', type: 'nominal', title: null },
      color: { aggregate: 'sum', field: 'price', type: 'quantitative', title: 'Price' },
    },
  },
};
