import type { VisualizationExample } from '../types.js';

export const boxplot: VisualizationExample = {
  id: 'boxplot',
  title: 'Box plot',
  domain: 'visualization',
  toolkit: 'vega-lite',

  description: 'Median and quartiles of penguin body mass by species.',
  spec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    description:
      'A vertical box plot showing median and lower and upper quartiles of the distribution of body mass of penguins.',
    data: { url: 'https://raw.githubusercontent.com/vega/vega-datasets/next/data/penguins.json' },
    mark: 'boxplot',
    encoding: {
      x: { field: 'Species', type: 'nominal' },
      color: { field: 'Species', type: 'nominal', legend: null },
      y: {
        field: 'Body Mass (g)',
        type: 'quantitative',
        scale: { zero: false },
      },
    },
  },
};
