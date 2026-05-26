import type { VisualizationExample } from '../types.js';

export const choroplethMap: VisualizationExample = {
  id: 'choropleth-map',
  title: 'Choropleth map',
  domain: 'visualization',
  toolkit: 'vega-lite',

  description: 'US county-level unemployment rates on a choropleth map.',
  spec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    width: 500,
    height: 300,
    data: {
      url: 'https://raw.githubusercontent.com/vega/vega-datasets/next/data/us-10m.json',
      format: { type: 'topojson', feature: 'counties' },
    },
    transform: [
      {
        lookup: 'id',
        from: {
          data: {
            url: 'https://raw.githubusercontent.com/vega/vega-datasets/next/data/unemployment.tsv',
          },
          key: 'id',
          fields: ['rate'],
        },
      },
    ],
    projection: { type: 'albersUsa' },
    mark: 'geoshape',
    encoding: {
      color: { field: 'rate', type: 'quantitative' },
    },
  },
};
