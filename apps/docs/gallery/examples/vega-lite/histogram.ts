import type { VisualizationExample } from '../types.js';

export const histogram: VisualizationExample = {
  id: 'histogram',
  title: 'Histogram',
  domain: 'visualization',
  toolkit: 'vega-lite',
  tags: ['bar', 'histogram', 'binned'],
  description: 'Distribution of IMDB ratings, binned.',
  spec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { url: 'https://raw.githubusercontent.com/vega/vega-datasets/next/data/movies.json' },
    mark: 'bar',
    encoding: {
      x: { bin: true, field: 'IMDB Rating' },
      y: { aggregate: 'count' },
    },
  },
};
