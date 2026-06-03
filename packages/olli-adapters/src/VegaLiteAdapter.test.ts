import { describe, it, expect } from 'vitest';
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

  describe('structure regression', () => {
    for (const example of vlExamples) {
      it(`${example.id}`, async () => {
        const olliSpec = await VegaLiteAdapter(example.spec);
        expect(structuralSkeleton(olliSpec)).toMatchSnapshot();
      }, 30000);
    }
  });
});
