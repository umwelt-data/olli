import { describe, it, expect } from 'vitest';
import { VegaAdapter } from './index.js';
import { getMarkType } from 'olli-vis';
import type { UnitOlliVisSpec } from 'olli-vis';

const stackedBarSpec = {
  $schema: 'https://vega.github.io/schema/vega/v6.json',
  description: 'A basic stacked bar chart example.',
  width: 500,
  height: 200,
  data: [
    {
      name: 'table',
      values: [
        { x: 0, y: 28, c: 0 }, { x: 0, y: 55, c: 1 },
        { x: 1, y: 43, c: 0 }, { x: 1, y: 91, c: 1 },
        { x: 2, y: 81, c: 0 }, { x: 2, y: 53, c: 1 },
        { x: 3, y: 19, c: 0 }, { x: 3, y: 87, c: 1 },
        { x: 4, y: 52, c: 0 }, { x: 4, y: 48, c: 1 },
      ],
      transform: [
        {
          type: 'stack',
          groupby: ['x'],
          sort: { field: 'c' },
          field: 'y',
        },
      ],
    },
  ],
  scales: [
    {
      name: 'x',
      type: 'band',
      range: 'width',
      domain: { data: 'table', field: 'x' },
    },
    {
      name: 'y',
      type: 'linear',
      range: 'height',
      nice: true, zero: true,
      domain: { data: 'table', field: 'y1' },
    },
    {
      name: 'color',
      type: 'ordinal',
      range: 'category',
      domain: { data: 'table', field: 'c' },
    },
  ],
  axes: [
    { orient: 'bottom', scale: 'x', zindex: 1 },
    { orient: 'left', scale: 'y', zindex: 1 },
  ],
  marks: [
    {
      type: 'rect',
      from: { data: 'table' },
      encode: {
        enter: {
          x: { scale: 'x', field: 'x' },
          width: { scale: 'x', band: 1, offset: -1 },
          y: { scale: 'y', field: 'y0' },
          y2: { scale: 'y', field: 'y1' },
          fill: { scale: 'color', field: 'c' },
        },
      },
    },
  ],
};

const populationSpec = {
  $schema: 'https://vega.github.io/schema/vega/v6.json',
  description: 'An annotated line chart of the population of Falkensee, Germany.',
  width: 500,
  height: 250,
  title: 'Population of Falkensee',
  data: [
    {
      name: 'table',
      values: [
        { year: 1875, population: 1309 },
        { year: 1890, population: 1558 },
        { year: 1910, population: 4512 },
        { year: 1925, population: 8180 },
        { year: 2014, population: 41777 },
      ],
    },
    {
      name: 'annotation',
      values: [
        { start: 1933, end: 1945, text: 'Nazi Rule' },
        { start: 1948, end: 1989, text: 'GDR (East Germany)' },
      ],
    },
  ],
  scales: [
    {
      name: 'x',
      type: 'linear',
      range: 'width',
      zero: false,
      domain: { data: 'table', field: 'year' },
    },
    {
      name: 'y',
      type: 'linear',
      range: 'height',
      nice: true,
      zero: true,
      domain: { data: 'table', field: 'population' },
    },
    {
      name: 'color',
      type: 'ordinal',
      domain: { data: 'annotation', field: 'text' },
      range: ['black', 'red'],
    },
  ],
  axes: [
    { orient: 'left', scale: 'y', title: 'Population', titlePadding: 10, grid: true },
    { orient: 'bottom', scale: 'x', format: 'd', title: 'Year', tickCount: 15 },
  ],
  marks: [
    {
      type: 'rect',
      from: { data: 'annotation' },
      encode: {
        enter: {
          x: { scale: 'x', field: 'start' },
          x2: { scale: 'x', field: 'end' },
          fill: { scale: 'color', field: 'text' },
          opacity: { value: 0.2 },
        },
      },
    },
    {
      type: 'line',
      from: { data: 'table' },
      encode: {
        enter: {
          x: { scale: 'x', field: 'year' },
          y: { scale: 'y', field: 'population' },
          stroke: { value: 'steelblue' },
        },
      },
    },
  ],
  legends: [
    {
      fill: 'color',
      title: 'Period',
      orient: 'top-left',
      offset: 8,
    },
  ],
};

const simpleScatterSpec = {
  $schema: 'https://vega.github.io/schema/vega/v6.json',
  description: 'A simple scatter plot.',
  width: 400,
  height: 300,
  data: [
    {
      name: 'points',
      values: [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 15 },
        { x: 4, y: 25 },
        { x: 5, y: 30 },
      ],
    },
  ],
  scales: [
    {
      name: 'xscale',
      type: 'linear',
      range: 'width',
      domain: { data: 'points', field: 'x' },
    },
    {
      name: 'yscale',
      type: 'linear',
      range: 'height',
      domain: { data: 'points', field: 'y' },
    },
  ],
  axes: [
    { orient: 'bottom', scale: 'xscale', title: 'X Value' },
    { orient: 'left', scale: 'yscale', title: 'Y Value' },
  ],
  marks: [
    {
      type: 'symbol',
      from: { data: 'points' },
      encode: {
        enter: {
          x: { scale: 'xscale', field: 'x' },
          y: { scale: 'yscale', field: 'y' },
          size: { value: 50 },
        },
      },
    },
  ],
};

const facetedSpec = {
  $schema: 'https://vega.github.io/schema/vega/v6.json',
  description: 'A faceted chart.',
  width: 200,
  data: [
    {
      name: 'table',
      values: [
        { site: 'A', yield: 10, variety: 'v1' },
        { site: 'A', yield: 20, variety: 'v2' },
        { site: 'B', yield: 30, variety: 'v1' },
        { site: 'B', yield: 40, variety: 'v2' },
      ],
    },
  ],
  scales: [
    {
      name: 'xscale',
      type: 'linear',
      range: 'width',
      domain: { data: 'table', field: 'yield' },
    },
  ],
  axes: [
    { orient: 'bottom', scale: 'xscale', title: 'Yield' },
  ],
  marks: [
    {
      type: 'group',
      from: {
        facet: {
          data: 'table',
          name: 'sites',
          groupby: 'site',
        },
      },
      scales: [
        {
          name: 'yscale',
          type: 'point',
          range: [0, 100],
          domain: { data: 'table', field: 'variety' },
        },
      ],
      axes: [
        { orient: 'left', scale: 'yscale', title: 'Variety' },
      ],
      marks: [
        {
          type: 'symbol',
          from: { data: 'sites' },
          encode: {
            enter: {
              x: { scale: 'xscale', field: 'yield' },
              y: { scale: 'yscale', field: 'variety' },
            },
          },
        },
      ],
    },
  ],
};

describe('VegaAdapter', () => {
  describe('stacked bar chart', () => {
    it('extracts correct data', async () => {
      const result = await VegaAdapter(stackedBarSpec) as UnitOlliVisSpec;
      expect(result.data.length).toBe(10);
      expect(result.data[0]).toHaveProperty('x');
      expect(result.data[0]).toHaveProperty('y');
      expect(result.data[0]).toHaveProperty('c');
    });

    it('extracts axes', async () => {
      const result = await VegaAdapter(stackedBarSpec) as UnitOlliVisSpec;
      expect(result.axes).toHaveLength(2);
      const xAxis = result.axes!.find(a => a.axisType === 'x');
      const yAxis = result.axes!.find(a => a.axisType === 'y');
      expect(xAxis).toBeDefined();
      expect(yAxis).toBeDefined();
      expect(xAxis!.field).toBe('x');
      expect(yAxis!.field).toBe('y1');
    });

    it('mark is bar with stack', async () => {
      const result = await VegaAdapter(stackedBarSpec) as UnitOlliVisSpec;
      expect(getMarkType(result.mark)).toBe('bar');
      expect(typeof result.mark === 'object' && result.mark.stack).toBe('stacked');
    });

    it('description is preserved', async () => {
      const result = await VegaAdapter(stackedBarSpec) as UnitOlliVisSpec;
      expect(result.description).toBe('A basic stacked bar chart example.');
    });
  });

  describe('population chart with legend', () => {
    it('extracts both axes with titles', async () => {
      const result = await VegaAdapter(populationSpec) as UnitOlliVisSpec;
      expect(result.axes!.length).toBe(2);
      const yAxis = result.axes!.find(a => a.axisType === 'y');
      const xAxis = result.axes!.find(a => a.axisType === 'x');
      expect(yAxis).toBeDefined();
      expect(xAxis).toBeDefined();
      expect(yAxis!.field).toBe('population');
      expect(yAxis!.title).toBe('Population');
      expect(xAxis!.field).toBe('year');
      expect(xAxis!.title).toBe('Year');
    });

    it('extracts legend', async () => {
      const result = await VegaAdapter(populationSpec) as UnitOlliVisSpec;
      expect(result.legends).toHaveLength(1);
      expect(result.legends![0]!.channel).toBe('color');
      expect(result.legends![0]!.field).toBe('text');
      expect(result.legends![0]!.title).toBe('Period');
    });

    it('extracts chart title', async () => {
      const result = await VegaAdapter(populationSpec) as UnitOlliVisSpec;
      expect(result.title).toBe('Population of Falkensee');
    });

    it('extracts data from primary mark dataset', async () => {
      const result = await VegaAdapter(populationSpec) as UnitOlliVisSpec;
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('mark is line', async () => {
      const result = await VegaAdapter(populationSpec) as UnitOlliVisSpec;
      expect(result.mark).toBe('line');
    });
  });

  describe('simple scatter plot', () => {
    it('extracts data', async () => {
      const result = await VegaAdapter(simpleScatterSpec) as UnitOlliVisSpec;
      expect(result.data).toHaveLength(5);
      expect(result.data[0]).toHaveProperty('x');
      expect(result.data[0]).toHaveProperty('y');
    });

    it('mark is point (symbol -> point)', async () => {
      const result = await VegaAdapter(simpleScatterSpec) as UnitOlliVisSpec;
      expect(result.mark).toBe('point');
    });

    it('extracts axes with titles', async () => {
      const result = await VegaAdapter(simpleScatterSpec) as UnitOlliVisSpec;
      expect(result.axes).toHaveLength(2);
      const xAxis = result.axes!.find(a => a.axisType === 'x');
      const yAxis = result.axes!.find(a => a.axisType === 'y');
      expect(xAxis!.field).toBe('x');
      expect(xAxis!.title).toBe('X Value');
      expect(yAxis!.field).toBe('y');
      expect(yAxis!.title).toBe('Y Value');
    });

    it('has no legends', async () => {
      const result = await VegaAdapter(simpleScatterSpec) as UnitOlliVisSpec;
      expect(result.legends).toHaveLength(0);
    });
  });

  describe('faceted chart', () => {
    it('detects facet field', async () => {
      const result = await VegaAdapter(facetedSpec) as UnitOlliVisSpec;
      expect(result.facet).toBe('site');
    });

    it('extracts axes from top-level and nested group', async () => {
      const result = await VegaAdapter(facetedSpec) as UnitOlliVisSpec;
      expect(result.axes!.length).toBe(2);
      const xAxis = result.axes!.find(a => a.axisType === 'x');
      const yAxis = result.axes!.find(a => a.axisType === 'y');
      expect(xAxis).toBeDefined();
      expect(yAxis).toBeDefined();
      expect(xAxis!.field).toBe('yield');
      expect(yAxis!.field).toBe('variety');
    });

    it('mark is point', async () => {
      const result = await VegaAdapter(facetedSpec) as UnitOlliVisSpec;
      expect(result.mark).toBe('point');
    });

    it('extracts data', async () => {
      const result = await VegaAdapter(facetedSpec) as UnitOlliVisSpec;
      expect(result.data).toHaveLength(4);
    });
  });

  describe('axis ticks', () => {
    it('quantitative axes have ticks', async () => {
      const result = await VegaAdapter(simpleScatterSpec) as UnitOlliVisSpec;
      const xAxis = result.axes!.find(a => a.axisType === 'x');
      const yAxis = result.axes!.find(a => a.axisType === 'y');
      expect(xAxis!.ticks).toBeDefined();
      expect(xAxis!.ticks!.length).toBeGreaterThan(0);
      expect(yAxis!.ticks).toBeDefined();
      expect(yAxis!.ticks!.length).toBeGreaterThan(0);
    });

    it('nominal/band axes have ticks with unique values', async () => {
      const result = await VegaAdapter(stackedBarSpec) as UnitOlliVisSpec;
      const xAxis = result.axes!.find(a => a.axisType === 'x');
      expect(xAxis!.ticks).toBeDefined();
      expect(xAxis!.ticks!.length).toBe(5);
    });
  });
});
