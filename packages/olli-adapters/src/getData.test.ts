import { describe, it, expect } from 'vitest';
import { VegaLiteAdapter } from './index.js';
import type { UnitOlliVisSpec, OlliVisSpec } from 'olli-vis';

function getUnitData(spec: OlliVisSpec) {
  if ('operator' in spec) {
    return spec.units.map((u) => u.data);
  }
  return [(spec as UnitOlliVisSpec).data];
}

describe('getData regression', () => {
  it('no transforms: passes raw data through', async () => {
    const spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: {
        values: [
          { category: 'A', amount: 28 },
          { category: 'B', amount: 55 },
          { category: 'C', amount: 43 },
        ],
      },
      mark: 'bar',
      encoding: {
        x: { field: 'category', type: 'nominal' },
        y: { field: 'amount', type: 'quantitative' },
      },
    };

    const olliSpec = (await VegaLiteAdapter(spec)) as UnitOlliVisSpec;
    const data = olliSpec.data;

    expect(data).toHaveLength(3);
    expect(Object.keys(data[0]!)).toContain('category');
    expect(Object.keys(data[0]!)).toContain('amount');
    expect(data.map((d) => d.category)).toEqual(['A', 'B', 'C']);
    expect(data.map((d) => d.amount)).toEqual([28, 55, 43]);
  });

  it('aggregate: groups and computes mean', async () => {
    const spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: {
        values: [
          { month: 'Jan', temp: 10 },
          { month: 'Jan', temp: 20 },
          { month: 'Feb', temp: 30 },
          { month: 'Feb', temp: 40 },
          { month: 'Mar', temp: 50 },
        ],
      },
      mark: 'bar',
      encoding: {
        x: { field: 'month', type: 'nominal' },
        y: { aggregate: 'mean', field: 'temp', type: 'quantitative' },
      },
    };

    const olliSpec = (await VegaLiteAdapter(spec)) as UnitOlliVisSpec;
    const data = olliSpec.data;

    expect(data).toHaveLength(3);
    const fields = Object.keys(data[0]!);
    expect(fields).toContain('month');
    expect(fields).toContain('mean_temp');

    const sorted = [...data].sort((a, b) => String(a.month).localeCompare(String(b.month)));
    expect(sorted[1]!.mean_temp).toBe(15);
    expect(sorted[0]!.mean_temp).toBe(35);
    expect(sorted[2]!.mean_temp).toBe(50);
  });

  it('bin + count: creates binned histogram data', async () => {
    const spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: {
        values: [
          { score: 1 },
          { score: 2 },
          { score: 3 },
          { score: 5 },
          { score: 7 },
          { score: 8 },
          { score: 9 },
          { score: 10 },
        ],
      },
      mark: 'bar',
      encoding: {
        x: { bin: true, field: 'score' },
        y: { aggregate: 'count' },
      },
    };

    const olliSpec = (await VegaLiteAdapter(spec)) as UnitOlliVisSpec;
    const data = olliSpec.data;

    expect(data.length).toBeGreaterThan(0);
    const fields = Object.keys(data[0]!);
    const binField = fields.find((f) => f.startsWith('bin') && f.includes('score') && !f.endsWith('_end'));
    expect(binField).toBeDefined();
    const binEndField = binField + '_end';
    expect(fields).toContain(binEndField);
    expect(fields).toContain('__count');

    const totalCount = data.reduce((sum, d) => sum + (d.__count as number), 0);
    expect(totalCount).toBe(8);
  });

  it('timeUnit + aggregate + stack: stacked area data', async () => {
    const spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: {
        values: [
          { date: '2020-01-15', series: 'A', count: 10 },
          { date: '2020-01-20', series: 'B', count: 20 },
          { date: '2020-02-10', series: 'A', count: 30 },
          { date: '2020-02-15', series: 'B', count: 40 },
        ],
      },
      mark: 'area',
      encoding: {
        x: { timeUnit: 'yearmonth', field: 'date' },
        y: { aggregate: 'sum', field: 'count' },
        color: { field: 'series' },
      },
    };

    const olliSpec = (await VegaLiteAdapter(spec)) as UnitOlliVisSpec;
    const data = olliSpec.data;

    expect(data.length).toBeGreaterThan(0);
    const fields = Object.keys(data[0]!);
    expect(fields).toContain('yearmonth_date');
    expect(fields).toContain('sum_count');
    expect(fields).toContain('series');
  });

  it('filter expression: filters rows by predicate', async () => {
    const spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: {
        values: [
          { symbol: 'GOOG', price: 100 },
          { symbol: 'AAPL', price: 200 },
          { symbol: 'GOOG', price: 150 },
          { symbol: 'MSFT', price: 300 },
        ],
      },
      mark: 'line',
      encoding: {
        x: { field: 'price', type: 'quantitative' },
        y: { field: 'price', type: 'quantitative' },
      },
      transform: [{ filter: "datum.symbol==='GOOG'" }],
    };

    const olliSpec = (await VegaLiteAdapter(spec)) as UnitOlliVisSpec;
    const data = olliSpec.data;

    expect(data).toHaveLength(2);
    expect(data.every((d) => d.symbol === 'GOOG')).toBe(true);
  });

  it('multi-dataset: concat chart produces separate datasets', async () => {
    const spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: {
        values: [
          { x: 1, y: 2, cat: 'a' },
          { x: 3, y: 4, cat: 'b' },
          { x: 5, y: 6, cat: 'a' },
        ],
      },
      hconcat: [
        {
          mark: 'bar',
          encoding: {
            x: { field: 'cat', type: 'nominal' },
            y: { aggregate: 'count' },
          },
        },
        {
          mark: 'point',
          encoding: {
            x: { field: 'x', type: 'quantitative' },
            y: { field: 'y', type: 'quantitative' },
          },
        },
      ],
    };

    const olliSpec = await VegaLiteAdapter(spec);
    expect('operator' in olliSpec).toBe(true);
    if ('operator' in olliSpec) {
      expect(olliSpec.units.length).toBe(2);
      const barData = olliSpec.units[0]!.data;
      const scatterData = olliSpec.units[1]!.data;

      expect(barData.length).toBeGreaterThan(0);
      expect(Object.keys(barData[0]!)).toContain('__count');

      expect(scatterData).toHaveLength(3);
      expect(Object.keys(scatterData[0]!)).toContain('x');
      expect(Object.keys(scatterData[0]!)).toContain('y');
    }
  });

  it('aggregate count: produces __count field', async () => {
    const spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: {
        values: [
          { cat: 'a' },
          { cat: 'a' },
          { cat: 'b' },
          { cat: 'b' },
          { cat: 'b' },
        ],
      },
      mark: 'bar',
      encoding: {
        x: { field: 'cat', type: 'nominal' },
        y: { aggregate: 'count' },
      },
    };

    const olliSpec = (await VegaLiteAdapter(spec)) as UnitOlliVisSpec;
    const data = olliSpec.data;

    expect(data).toHaveLength(2);
    const sorted = [...data].sort((a, b) => String(a.cat).localeCompare(String(b.cat)));
    expect(sorted[0]!.__count).toBe(2);
    expect(sorted[1]!.__count).toBe(3);
  });

  it('layer: shared dataset across layers', async () => {
    const spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: {
        values: [
          { x: 1, y: 10, z: 100 },
          { x: 2, y: 20, z: 200 },
          { x: 3, y: 30, z: 300 },
        ],
      },
      layer: [
        {
          mark: 'line',
          encoding: {
            x: { field: 'x', type: 'quantitative' },
            y: { field: 'y', type: 'quantitative' },
          },
        },
        {
          mark: 'point',
          encoding: {
            x: { field: 'x', type: 'quantitative' },
            y: { field: 'z', type: 'quantitative' },
          },
        },
      ],
    };

    const olliSpec = await VegaLiteAdapter(spec);
    if ('operator' in olliSpec) {
      for (const unit of olliSpec.units) {
        expect(unit.data).toHaveLength(3);
      }
    } else {
      expect((olliSpec as UnitOlliVisSpec).data).toHaveLength(3);
    }
  });

  it('facet: data includes facet field', async () => {
    const spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: {
        values: [
          { site: 'A', val: 10 },
          { site: 'A', val: 20 },
          { site: 'B', val: 30 },
          { site: 'B', val: 40 },
        ],
      },
      facet: { field: 'site', type: 'nominal' },
      spec: {
        mark: 'point',
        encoding: {
          x: { field: 'val', type: 'quantitative' },
          y: { field: 'val', type: 'quantitative' },
        },
      },
    };

    const olliSpec = (await VegaLiteAdapter(spec)) as UnitOlliVisSpec;
    expect(olliSpec.data).toHaveLength(4);
    expect(olliSpec.facet).toBe('site');
    expect(Object.keys(olliSpec.data[0]!)).toContain('site');
    expect(Object.keys(olliSpec.data[0]!)).toContain('val');
  });
});
