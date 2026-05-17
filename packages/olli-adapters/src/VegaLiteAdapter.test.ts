import { describe, it, expect } from 'vitest';
import { VegaLiteAdapter } from './index.js';
import { lowerVisSpec } from 'olli-vis';
import type { UnitOlliVisSpec } from 'olli-vis';

describe('VegaLiteAdapter', () => {
  it('multi-series line chart y-axes have filteredData children', async () => {
    const spec = {
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
    };

    const olliSpec = await VegaLiteAdapter(spec) as UnitOlliVisSpec;
    const graph = lowerVisSpec(olliSpec);
    const yAxes = [...graph.edges.values()].filter(e => e.role === 'yAxis');

    expect(yAxes.length).toBeGreaterThan(0);
    for (const yAxis of yAxes) {
      expect(yAxis.children.length).toBeGreaterThan(0);
      for (const childId of yAxis.children) {
        const child = graph.edges.get(childId)!;
        expect(child.role).toBe('filteredData');
      }
    }
  }, 30000);

  it('quantitative fields are coerced to numbers', async () => {
    const spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { url: 'https://raw.githubusercontent.com/vega/vega-datasets/next/data/stocks.csv' },
      mark: 'line',
      encoding: {
        x: { field: 'date', type: 'temporal' },
        y: { field: 'price', type: 'quantitative' },
      },
      transform: [{ filter: "datum.symbol==='GOOG'" }],
    };

    const olliSpec = await VegaLiteAdapter(spec) as UnitOlliVisSpec;
    expect(typeof olliSpec.data[0]!.price).toBe('number');
  }, 30000);
});
