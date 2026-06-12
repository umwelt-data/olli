import type { VisualizationExample } from '../types.js';

export const dotMap: VisualizationExample = {
  id: 'dot-map',
  title: 'Dot map',
  domain: 'visualization',
  toolkit: 'vega-lite',

  description: 'One dot per U.S. zip code, colored by the first digit of the code.',
  spec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    width: 500,
    height: 300,
    data: { url: 'https://raw.githubusercontent.com/vega/vega-datasets/next/data/zipcodes.csv' },
    transform: [{ calculate: 'substring(datum.zip_code, 0, 1)', as: 'digit' }],
    projection: { type: 'albersUsa' },
    mark: 'circle',
    encoding: {
      longitude: { field: 'longitude', type: 'quantitative' },
      latitude: { field: 'latitude', type: 'quantitative' },
      size: { value: 1 },
      color: { field: 'digit', type: 'nominal' },
    },
  },
};
