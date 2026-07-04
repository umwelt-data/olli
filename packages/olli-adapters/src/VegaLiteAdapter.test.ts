import { describe, it, expect, vi } from 'vitest';
import { VegaLiteAdapter, VegaLiteAdapterSync } from './index.js';
import { lowerVisSpec, getMarkType } from 'olli-vis';
import type { OlliVisSpec, UnitOlliVisSpec } from 'olli-vis';
import { examples } from '../../../apps/docs/gallery/examples/index.js';
import type { VisualizationExample } from '../../../apps/docs/gallery/examples/index.js';

function unitSkeleton(spec: UnitOlliVisSpec) {
  return {
    mark: spec.mark,
    facet: spec.facet,
    fields: spec.fields?.map((f) => ({ field: f.field, type: f.type })),
    axes: spec.axes?.map((a) => ({ axisType: a.axisType, field: a.field })),
    legends: spec.legends?.map((l) => ({ channel: l.channel, field: l.field })),
  };
}

function structuralSkeleton(spec: OlliVisSpec) {
  if ('operator' in spec) {
    return {
      operator: spec.operator,
      units: spec.units.map(unitSkeleton),
    };
  }
  return unitSkeleton(spec as UnitOlliVisSpec);
}

const vlExamples = examples.filter(
  (e): e is VisualizationExample => e.domain === 'visualization',
);

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

  it('streamgraph y-axis has filteredData children', async () => {
    const spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 300,
      height: 200,
      data: { url: 'https://raw.githubusercontent.com/vega/vega-datasets/next/data/unemployment-across-industries.json' },
      mark: 'area',
      encoding: {
        x: {
          timeUnit: 'yearmonth',
          field: 'date',
          axis: { domain: false, format: '%Y', tickSize: 0 },
        },
        y: { aggregate: 'sum', field: 'count', axis: null, stack: 'center' },
        color: { field: 'series', scale: { scheme: 'category20b' } },
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

  it('faceted chart x-axis has filteredData children', async () => {
    const spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      description: "Becker's Barley Trellis Plot.",
      data: { url: 'https://raw.githubusercontent.com/vega/vega-datasets/next/data/barley.json' },
      mark: 'point',
      height: { step: 12 },
      encoding: {
        facet: {
          field: 'site',
          type: 'ordinal',
          columns: 2,
          sort: { op: 'median', field: 'yield' },
        },
        x: { field: 'yield', type: 'quantitative', scale: { zero: false } },
        y: { field: 'variety', type: 'ordinal', sort: '-x' },
        color: { field: 'year', type: 'nominal' },
      },
    };

    const olliSpec = await VegaLiteAdapter(spec) as UnitOlliVisSpec;
    const graph = lowerVisSpec(olliSpec);
    const xAxes = [...graph.edges.values()].filter(e => e.role === 'xAxis');

    expect(xAxes.length).toBeGreaterThan(0);
    for (const xAxis of xAxes) {
      expect(xAxis.children.length).toBeGreaterThan(0);
      for (const childId of xAxis.children) {
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

  it('histogram bins have filteredData children', async () => {
    const example = vlExamples.find(e => e.id === 'histogram')!;
    const olliSpec = await VegaLiteAdapter(example.spec) as UnitOlliVisSpec;
    const graph = lowerVisSpec(olliSpec);
    const root = graph.edges.get(graph.roots[0]!)!;
    expect(root.children.length).toBeGreaterThan(0);
    for (const childId of root.children) {
      const child = graph.edges.get(childId)!;
      expect(child.role).toBe('filteredData');
    }
  }, 30000);

  it('concat chart scatterplot x and y axes have filteredData children', async () => {
    const example = vlExamples.find(e => e.id === 'concat-chart')!;
    const olliSpec = await VegaLiteAdapter(example.spec);
    expect('operator' in olliSpec).toBe(true);
    if ('operator' in olliSpec) {
      const scatterUnit = olliSpec.units[1]!;
      const graph = lowerVisSpec(scatterUnit);
      const xAxes = [...graph.edges.values()].filter(e => e.role === 'xAxis');
      const yAxes = [...graph.edges.values()].filter(e => e.role === 'yAxis');
      expect(xAxes.length).toBeGreaterThan(0);
      expect(yAxes.length).toBeGreaterThan(0);
      for (const axis of [...xAxes, ...yAxes]) {
        expect(axis.children.length).toBeGreaterThan(0);
      }
    }
  }, 30000);

  it('area chart x-axis has tick-based bins, not one per month', async () => {
    const example = vlExamples.find(e => e.id === 'area-chart')!;
    const olliSpec = await VegaLiteAdapter(example.spec) as UnitOlliVisSpec;
    const graph = lowerVisSpec(olliSpec);
    const xAxes = [...graph.edges.values()].filter(e => e.role === 'xAxis');
    expect(xAxes.length).toBe(1);
    expect(xAxes[0]!.children.length).toBeGreaterThan(0);
    expect(xAxes[0]!.children.length).toBeLessThan(20);
    for (const childId of xAxes[0]!.children) {
      const child = graph.edges.get(childId)!;
      expect(child.role).toBe('filteredData');
    }
  }, 30000);

  // Stacked area y-axis intentionally has 0 children: the y-axis ticks represent
  // stacked cumulative totals (0–15000) but per-row sum_count values are individual
  // series contributions (2–2440). Binning by either scale would produce misleading
  // highlights — per-series bins don't map to visual positions, and stacked-total bins
  // would lump nearly all rows into the first bucket.
  it('stacked-area-chart y-axis has no children (stacked cumulative axis)', async () => {
    const example = vlExamples.find(e => e.id === 'stacked-area-chart')!;
    const olliSpec = await VegaLiteAdapter(example.spec) as UnitOlliVisSpec;
    const graph = lowerVisSpec(olliSpec);
    const yAxes = [...graph.edges.values()].filter(e => e.role === 'yAxis');

    expect(yAxes.length).toBe(1);
    expect(yAxes[0]!.children.length).toBe(0);
  }, 30000);

  it('stacked-area-chart x-axis still has children (non-cumulative axis)', async () => {
    const example = vlExamples.find(e => e.id === 'stacked-area-chart')!;
    const olliSpec = await VegaLiteAdapter(example.spec) as UnitOlliVisSpec;
    const graph = lowerVisSpec(olliSpec);
    const xAxes = [...graph.edges.values()].filter(e => e.role === 'xAxis');

    expect(xAxes.length).toBe(1);
    expect(xAxes[0]!.children.length).toBeGreaterThan(0);
  }, 30000);

  it('stacked-bar-chart mark has stack: stacked', async () => {
    const example = vlExamples.find(e => e.id === 'stacked-bar-chart')!;
    const olliSpec = await VegaLiteAdapter(example.spec) as UnitOlliVisSpec;
    expect(typeof olliSpec.mark === 'object' && olliSpec.mark.stack).toBe('stacked');
  }, 30000);

  it('stacked-area-chart mark has stack: stacked', async () => {
    const example = vlExamples.find(e => e.id === 'stacked-area-chart')!;
    const olliSpec = await VegaLiteAdapter(example.spec) as UnitOlliVisSpec;
    expect(typeof olliSpec.mark === 'object' && olliSpec.mark.stack).toBe('stacked');
  }, 30000);

  it('grouped-bar-chart mark has stack: grouped', async () => {
    const example = vlExamples.find(e => e.id === 'grouped-bar-chart')!;
    const olliSpec = await VegaLiteAdapter(example.spec) as UnitOlliVisSpec;
    expect(typeof olliSpec.mark === 'object' && olliSpec.mark.stack).toBe('grouped');
  }, 30000);

  it('pie chart mark is plain arc string', async () => {
    const example = vlExamples.find(e => e.id === 'pie-chart')!;
    const olliSpec = await VegaLiteAdapter(example.spec) as UnitOlliVisSpec;
    expect(olliSpec.mark).toBe('arc');
    expect(getMarkType(olliSpec.mark)).toBe('arc');
  }, 30000);

  it('donut chart mark has innerRadius', async () => {
    const example = vlExamples.find(e => e.id === 'donut-chart')!;
    const olliSpec = await VegaLiteAdapter(example.spec) as UnitOlliVisSpec;
    expect(getMarkType(olliSpec.mark)).toBe('arc');
    expect(typeof olliSpec.mark === 'object' && olliSpec.mark.innerRadius).toBe(50);
  }, 30000);

  describe('choropleth support', () => {
    const topology = {
      type: 'Topology',
      objects: {
        counties: {
          type: 'GeometryCollection',
          geometries: [
            { type: 'Point', coordinates: [0, 0], id: '01001', properties: {} },
            { type: 'Point', coordinates: [1, 1], id: '06037', properties: {} },
            { type: 'Point', coordinates: [2, 2], id: '17031', properties: {} },
          ],
        },
      },
      arcs: [],
    };

    const choroplethSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 500,
      height: 300,
      data: {
        values: topology,
        format: { type: 'topojson', feature: 'counties' },
      },
      transform: [{
        lookup: 'id',
        from: {
          data: {
            values: [
              { id: '1001', rate: 0.05 },
              { id: '6037', rate: 0.10 },
              { id: '17031', rate: 0.07 },
            ],
          },
          key: 'id',
          fields: ['rate'],
        },
      }],
      projection: { type: 'albersUsa' },
      mark: 'geoshape',
      encoding: {
        color: { field: 'rate', type: 'quantitative' },
      },
    };

    it('produces geoshape mark', () => {
      const olliSpec = VegaLiteAdapterSync(choroplethSpec) as UnitOlliVisSpec;
      expect(getMarkType(olliSpec.mark)).toBe('geoshape');
    });

    it('has color legend for rate', () => {
      const olliSpec = VegaLiteAdapterSync(choroplethSpec) as UnitOlliVisSpec;
      const colorLegend = olliSpec.legends?.find(l => l.channel === 'color');
      expect(colorLegend).toBeDefined();
      expect(colorLegend!.field).toBe('rate');
    });

    it('enriches data with geographic fields', () => {
      const olliSpec = VegaLiteAdapterSync(choroplethSpec) as UnitOlliVisSpec;
      expect(olliSpec.data.length).toBeGreaterThan(0);
      const hasGeoFields = olliSpec.data.some(d => d['state'] != null);
      expect(hasGeoFields).toBe(true);
      const hasRegion = olliSpec.data.some(d => d['region'] != null);
      expect(hasRegion).toBe(true);
    });

    it('has geographic fields in field defs', () => {
      const olliSpec = VegaLiteAdapterSync(choroplethSpec) as UnitOlliVisSpec;
      const fieldNames = olliSpec.fields?.map(f => f.field) ?? [];
      expect(fieldNames).toContain('state');
      expect(fieldNames).toContain('region');
    });

    it('infers structure with legend and geography guide', () => {
      const olliSpec = VegaLiteAdapterSync(choroplethSpec) as UnitOlliVisSpec;
      const graph = lowerVisSpec(olliSpec);
      const root = graph.edges.get(graph.roots[0]!)!;
      expect(root.children.length).toBeGreaterThanOrEqual(2);
      const childRoles = root.children.map(id => graph.edges.get(id)!.role);
      expect(childRoles).toContain('legend');
      expect(childRoles).toContain('guide');
    });

    it('computes ticks for quantitative color legend', () => {
      const olliSpec = VegaLiteAdapterSync(choroplethSpec) as UnitOlliVisSpec;
      const colorLegend = olliSpec.legends?.find(l => l.channel === 'color');
      expect(colorLegend!.ticks).toBeDefined();
      expect(colorLegend!.ticks!.length).toBeGreaterThan(0);
    });

    it('legend bins align with legend ticks', () => {
      const olliSpec = VegaLiteAdapterSync(choroplethSpec) as UnitOlliVisSpec;
      const colorLegend = olliSpec.legends?.find(l => l.channel === 'color');
      const ticks = colorLegend!.ticks as number[];

      const graph = lowerVisSpec(olliSpec);
      const root = graph.edges.get(graph.roots[0]!)!;
      const legendNodeId = root.children.find(id => graph.edges.get(id)!.role === 'legend')!;
      const legendNode = graph.edges.get(legendNodeId)!;
      const bins = legendNode.children.map(id => {
        const edge = graph.edges.get(id)!;
        const pred = edge.payload.predicate;
        return pred && 'range' in pred ? pred.range : undefined;
      }).filter(Boolean) as [number, number][];

      expect(bins.length).toBeGreaterThan(0);
      for (const [lo, hi] of bins) {
        expect(ticks).toContain(lo);
        expect(ticks).toContain(hi);
      }
    });

    it('does not compute ticks for nominal color legend', () => {
      const nominalSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        data: { values: [{ x: 1, cat: 'a' }, { x: 2, cat: 'b' }] },
        mark: 'point',
        encoding: {
          x: { field: 'x', type: 'quantitative' },
          color: { field: 'cat', type: 'nominal' },
        },
      };
      const olliSpec = VegaLiteAdapterSync(nominalSpec) as UnitOlliVisSpec;
      const colorLegend = olliSpec.legends?.find(l => l.channel === 'color');
      expect(colorLegend).toBeDefined();
      expect(colorLegend!.ticks).toBeUndefined();
    });
  });

  describe('scale.domain handling', () => {
    it('does not crash on param-valued scale.domain', () => {
      // overview+detail pattern: detail view's x domain is driven by a brush param
      const spec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
        data: { values: [
          { date: '2020-01-01', price: 10 },
          { date: '2020-02-01', price: 20 },
          { date: '2020-03-01', price: 15 },
        ] },
        vconcat: [
          {
            mark: 'area',
            encoding: {
              x: { field: 'date', type: 'temporal', scale: { domain: { param: 'brush' } } },
              y: { field: 'price', type: 'quantitative' },
            },
          },
          {
            mark: 'area',
            params: [{ name: 'brush', select: { type: 'interval', encodings: ['x'] } }],
            encoding: {
              x: { field: 'date', type: 'temporal' },
              y: { field: 'price', type: 'quantitative' },
            },
          },
        ],
      };
      expect(() => VegaLiteAdapterSync(spec)).not.toThrow();
    });

    it('still respects array scale.domain', () => {
      const spec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
        data: { values: [{ x: 3, y: 4 }, { x: 7, y: 8 }] },
        mark: 'point',
        encoding: {
          x: { field: 'x', type: 'quantitative', scale: { domain: [0, 10] } },
          y: { field: 'y', type: 'quantitative' },
        },
      };
      const olliSpec = VegaLiteAdapterSync(spec) as UnitOlliVisSpec;
      const xAxis = olliSpec.axes?.find(a => a.axisType === 'x');
      expect(xAxis?.ticks?.[0]).toBe(0);
      expect(xAxis?.ticks?.[xAxis.ticks.length - 1]).toBe(10);
    });
  });

  describe('nested composite views', () => {
    it('flattens vconcat of hconcats into a concat of units', () => {
      const values = [
        { a: 1, b: 10, c: 100, t: '2020-01-01' },
        { a: 2, b: 20, c: 200, t: '2020-02-01' },
      ];
      const spec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
        data: { values },
        vconcat: [
          {
            hconcat: [
              { mark: 'point', encoding: { x: { field: 'a', type: 'quantitative' }, y: { field: 'b', type: 'quantitative' } } },
              { mark: 'bar', encoding: { x: { field: 'a', type: 'quantitative' }, y: { field: 'c', type: 'quantitative' } } },
            ],
          },
          {
            hconcat: [
              { mark: 'line', encoding: { x: { field: 't', type: 'temporal' }, y: { field: 'b', type: 'quantitative' } } },
            ],
          },
        ],
      };
      const olliSpec = VegaLiteAdapterSync(spec);
      const units = 'operator' in olliSpec ? olliSpec.units : [olliSpec as UnitOlliVisSpec];
      if ('operator' in olliSpec) expect(olliSpec.operator).toBe('concat');
      expect(units.some(u => (u.fields?.length ?? 0) > 0)).toBe(true);
      const fieldNames = units.flatMap(u => u.fields?.map(f => f.field) ?? []);
      expect(fieldNames).toContain('a');
      expect(fieldNames).toContain('b');
    });

    it('flattens layer-of-layer and keeps the layer operator', () => {
      const values = [
        { day: 1, value: 50 },
        { day: 2, value: 300 },
      ];
      const spec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
        layer: [
          {
            data: { values },
            layer: [
              { mark: 'bar', encoding: { x: { field: 'day', type: 'ordinal' }, y: { field: 'value', type: 'quantitative' } } },
              { mark: { type: 'bar', color: 'red' }, encoding: { x: { field: 'day', type: 'ordinal' }, y: { field: 'value', type: 'quantitative' } } },
            ],
          },
        ],
      };
      const olliSpec = VegaLiteAdapterSync(spec);
      const units = 'operator' in olliSpec ? olliSpec.units : [olliSpec as UnitOlliVisSpec];
      const fieldNames = units.flatMap(u => u.fields?.map(f => f.field) ?? []);
      expect(fieldNames).toContain('day');
      expect(fieldNames).toContain('value');
    });
  });

  describe('repeat with layered children', () => {
    it('produces one merged unit per repeat value', () => {
      const values = [
        { date: '2020-01-01', a: 1, b: 10, city: 'X' },
        { date: '2020-02-01', a: 2, b: 20, city: 'X' },
        { date: '2020-01-01', a: 3, b: 30, city: 'Y' },
        { date: '2020-02-01', a: 4, b: 40, city: 'Y' },
      ];
      const spec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
        data: { values },
        repeat: { column: ['a', 'b'] },
        spec: {
          layer: [
            {
              mark: 'line',
              encoding: {
                x: { field: 'date', type: 'temporal' },
                y: { aggregate: 'mean', field: { repeat: 'column' } },
              },
            },
            {
              mark: 'line',
              encoding: {
                x: { field: 'date', type: 'temporal' },
                y: { field: { repeat: 'column' }, type: 'quantitative' },
                detail: { field: 'city', type: 'nominal' },
              },
            },
          ],
        },
      };
      const olliSpec = VegaLiteAdapterSync(spec);
      expect('operator' in olliSpec).toBe(true);
      if ('operator' in olliSpec) {
        expect(olliSpec.operator).toBe('concat');
        expect(olliSpec.units).toHaveLength(2);
        const fieldsPerUnit = olliSpec.units.map(u => u.fields?.map(f => f.field) ?? []);
        expect(fieldsPerUnit[0]).toContain('mean_a');
        expect(fieldsPerUnit[1]).toContain('mean_b');
        for (const u of olliSpec.units) {
          expect(u.data.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('recursive data resolution', () => {
    it('resolves data.url inside child layer views', async () => {
      const fetchStub = vi.fn(async () => new Response('day,value\n1,50\n2,300\n'));
      vi.stubGlobal('fetch', fetchStub);
      try {
        const spec = {
          $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
          layer: [
            {
              data: { url: 'https://example.com/values.csv' },
              mark: 'line',
              encoding: {
                x: { field: 'day', type: 'quantitative' },
                y: { field: 'value', type: 'quantitative' },
              },
            },
          ],
        };
        const olliSpec = await VegaLiteAdapter(spec);
        const units = 'operator' in olliSpec ? olliSpec.units : [olliSpec as UnitOlliVisSpec];
        expect(fetchStub).toHaveBeenCalledOnce();
        expect(units.some(u => (u.data?.length ?? 0) > 0)).toBe(true);
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe('ranged-mark axis field', () => {
    it('a view positioning on the ranged bar\'s end field takes over the axis', () => {
      // waterfall pattern: bar spans previous_sum -> sum, rule sits at sum
      const values = [
        { label: 'a', previous_sum: 0, sum: 10 },
        { label: 'b', previous_sum: 10, sum: 30 },
      ];
      const spec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
        data: { values },
        encoding: { x: { field: 'label', type: 'ordinal', sort: null } },
        layer: [
          {
            mark: 'bar',
            encoding: {
              y: { field: 'previous_sum', type: 'quantitative', title: 'Amount' },
              y2: { field: 'sum' },
            },
          },
          {
            mark: 'rule',
            encoding: { y: { field: 'sum', type: 'quantitative' } },
          },
        ],
      };
      const olliSpec = VegaLiteAdapterSync(spec) as UnitOlliVisSpec;
      const yAxes = olliSpec.axes?.filter(a => a.axisType === 'y');
      expect(yAxes).toHaveLength(1);
      expect(yAxes![0]!.field).toBe('sum');
      expect(yAxes![0]!.title).toBe('Amount');
    });
  });

  describe('geographic point charts', () => {
    it('surfaces unencoded place columns as fields', () => {
      const spec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
        data: { values: [
          { longitude: -72.6, latitude: 40.9, city: 'Holtsville', state: 'NY', county: 'Suffolk', digit: '0' },
          { longitude: -118.2, latitude: 34.0, city: 'Los Angeles', state: 'CA', county: 'Los Angeles', digit: '9' },
        ] },
        projection: { type: 'albersUsa' },
        mark: 'circle',
        encoding: {
          longitude: { field: 'longitude', type: 'quantitative' },
          latitude: { field: 'latitude', type: 'quantitative' },
          color: { field: 'digit', type: 'nominal' },
        },
      };
      const olliSpec = VegaLiteAdapterSync(spec) as UnitOlliVisSpec;
      const fieldNames = olliSpec.fields?.map(f => f.field);
      expect(fieldNames).toContain('city');
      expect(fieldNames).toContain('state');
      expect(fieldNames).toContain('county');
    });
  });

  describe('structure regression', () => {
    for (const example of vlExamples) {
      it(`${example.id}`, async () => {
        const olliSpec = await VegaLiteAdapter(example.spec);
        expect(structuralSkeleton(olliSpec)).toMatchSnapshot();
      }, 30000);
    }
  });

  // specs shaped like umwelt's compiled output (brush param, color condition
  // wrappers), covering gallery regressions reported from the umwelt docs
  describe('umwelt-style specs', () => {
    const brushColor = (encoding: object = { value: 'navy' }) => ({
      condition: { param: 'brush', empty: true, ...encoding },
      value: 'grey',
    });

    it('connected scatterplot order encoding becomes a navigable guide', () => {
      // umwelt type-coerces temporal fields to dates before compiling
      const values = [
        { year: '2000-01-01', miles: 9000, gas: 1.5 },
        { year: '2001-01-01', miles: 9500, gas: 1.6 },
        { year: '2002-01-01', miles: 9800, gas: 1.4 },
        { year: '2003-01-01', miles: 10000, gas: 1.7 },
      ];
      // umwelt renders line units as a layer of line + invisible highlight
      // circles, so the guide must survive the multi-spec merge path
      const encoding = {
        x: { field: 'miles', type: 'quantitative' },
        y: { field: 'gas', type: 'quantitative' },
        order: { field: 'year', type: 'temporal', timeUnit: 'year' },
        color: brushColor(),
      };
      const spec = {
        data: { values },
        layer: [
          { params: [{ name: 'brush', select: 'interval' }], mark: 'line', encoding },
          {
            mark: 'circle',
            encoding: {
              ...encoding,
              opacity: { condition: { param: 'brush', empty: false, value: 1 }, value: 0 },
            },
          },
        ],
      };
      const olliSpec = VegaLiteAdapterSync(spec) as UnitOlliVisSpec;
      // like axes, the guide references the timeUnit-derived column
      expect(olliSpec.guides?.map((g) => ({ field: g.field, channel: g.channel }))).toEqual([
        { field: 'year_year', channel: 'order' },
      ]);
      const graph = lowerVisSpec(olliSpec);
      const guideEdges = [...graph.edges.values()].filter((e) => e.role === 'guide');
      expect(guideEdges.length).toBe(1);
      expect(guideEdges[0]!.children.length).toBeGreaterThan(0);
    });

    it('layered chart keeps each layer\'s own mark', () => {
      const values = [
        { date: '2000-01-01', price: 10, symbol: 'A' },
        { date: '2000-01-01', price: 20, symbol: 'B' },
        { date: '2001-01-01', price: 30, symbol: 'A' },
        { date: '2001-01-01', price: 40, symbol: 'B' },
      ];
      const spec = {
        data: { values },
        layer: [
          {
            params: [{ name: 'brush', select: 'interval' }],
            mark: 'point',
            encoding: {
              x: { field: 'date', type: 'temporal', timeUnit: 'year' },
              y: { field: 'price', type: 'quantitative', scale: { zero: false } },
              color: brushColor({ field: 'symbol', type: 'nominal' }),
            },
          },
          {
            // umwelt renders aggregate lines as line + invisible highlight
            // circles; the overlay must not displace the line as the unit's mark
            layer: [
              {
                mark: 'line',
                encoding: {
                  x: { field: 'date', type: 'temporal' },
                  y: { field: 'price', type: 'quantitative', aggregate: 'mean' },
                  color: brushColor(),
                },
              },
              {
                mark: 'circle',
                encoding: {
                  x: { field: 'date', type: 'temporal' },
                  y: { field: 'price', type: 'quantitative', aggregate: 'mean' },
                  color: brushColor(),
                  opacity: { condition: { param: 'brush', empty: false, value: 1 }, value: 0 },
                },
              },
            ],
          },
        ],
      };
      const olliSpec = VegaLiteAdapterSync(spec);
      expect('operator' in olliSpec && olliSpec.units.map((u) => getMarkType(u.mark))).toEqual([
        'point',
        'line',
      ]);
    });

    it('bar colored by its own category axis field is not stacked', () => {
      const values = [
        { weather: 'sun', temp: 20 },
        { weather: 'sun', temp: 25 },
        { weather: 'rain', temp: 10 },
        { weather: 'fog', temp: 12 },
      ];
      const spec = {
        data: { values },
        params: [{ name: 'brush', select: 'interval' }],
        mark: 'bar',
        encoding: {
          y: { field: 'weather', type: 'nominal' },
          x: { field: 'temp', type: 'quantitative', aggregate: 'count' },
          color: brushColor({ field: 'weather', type: 'nominal' }),
        },
      };
      const olliSpec = VegaLiteAdapterSync(spec) as UnitOlliVisSpec;
      expect(getMarkType(olliSpec.mark)).toBe('bar');
      expect(typeof olliSpec.mark === 'object' ? olliSpec.mark.stack : undefined).toBeUndefined();
      // the count axis is a plain quantitative axis, so it keeps its ticks
      const xAxis = olliSpec.axes?.find((a) => a.axisType === 'x');
      expect(xAxis?.ticks?.length ?? 0).toBeGreaterThan(0);
    });

    it('bar colored by a different field is still stacked', () => {
      const values = [
        { weather: 'sun', site: 'a' },
        { weather: 'sun', site: 'b' },
        { weather: 'rain', site: 'a' },
      ];
      const spec = {
        data: { values },
        mark: 'bar',
        encoding: {
          y: { field: 'weather', type: 'nominal' },
          x: { type: 'quantitative', aggregate: 'count' },
          color: { field: 'site', type: 'nominal' },
        },
      };
      const olliSpec = VegaLiteAdapterSync(spec) as UnitOlliVisSpec;
      expect(typeof olliSpec.mark === 'object' && olliSpec.mark.stack).toBe('stacked');
    });
  });
});
