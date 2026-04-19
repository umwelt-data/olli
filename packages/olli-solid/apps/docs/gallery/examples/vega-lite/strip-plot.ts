import type { VisualizationExample } from '../types.js';

export const stripPlot: VisualizationExample = {
  id: 'strip-plot',
  title: 'Strip plot',
  domain: 'visualization',
  toolkit: 'vega-lite',
  tags: ['tick', 'strip', 'quantitative'],
  description: 'Tick marks showing horsepower by cylinder count.',
  spec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Shows the relationship between horsepower and the number of cylinders using tick marks.',
    data: { url: 'https://raw.githubusercontent.com/vega/vega-datasets/next/data/cars.json' },
    mark: 'tick',
    encoding: {
      x: { field: 'Horsepower', type: 'quantitative' },
      y: { field: 'Cylinders', type: 'ordinal' },
    },
  },
};
