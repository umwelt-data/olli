import { describe, it, expect } from 'vitest';
import { evaluateVegaData, extractOutputDatasets } from './vegaDataEval.js';

describe('evaluateVegaData', () => {
  it('passes through inline values', () => {
    const entries = [{ name: 'source_0', values: [{ a: 1 }, { a: 2 }] }];
    const store = evaluateVegaData(entries);
    expect(store['source_0']).toHaveLength(2);
    expect(store['source_0']![0]!.a).toBe(1);
  });

  it('resolves source references', () => {
    const entries = [
      { name: 'source_0', values: [{ a: 1 }] },
      { name: 'data_0', source: 'source_0' },
    ];
    const store = evaluateVegaData(entries);
    expect(store['data_0']).toHaveLength(1);
    expect(store['data_0']![0]!.a).toBe(1);
  });

  it('applies filter transform', () => {
    const entries = [
      {
        name: 'source_0',
        values: [
          { s: 'A', v: 1 },
          { s: 'B', v: 2 },
        ],
      },
      {
        name: 'data_0',
        source: 'source_0',
        transform: [{ type: 'filter', expr: "datum.s==='A'" }],
      },
    ];
    const store = evaluateVegaData(entries);
    expect(store['data_0']).toHaveLength(1);
    expect(store['data_0']![0]!.s).toBe('A');
  });

  it('applies aggregate transform', () => {
    const entries = [
      {
        name: 'source_0',
        values: [
          { cat: 'a', v: 10 },
          { cat: 'a', v: 20 },
          { cat: 'b', v: 30 },
        ],
      },
      {
        name: 'data_0',
        source: 'source_0',
        transform: [
          {
            type: 'aggregate',
            groupby: ['cat'],
            ops: ['mean', 'count'],
            fields: ['v', null],
            as: ['mean_v', '__count'],
          },
        ],
      },
    ];
    const store = evaluateVegaData(entries);
    expect(store['data_0']).toHaveLength(2);
    const a = store['data_0']!.find((d) => d.cat === 'a')!;
    const b = store['data_0']!.find((d) => d.cat === 'b')!;
    expect(a.mean_v).toBe(15);
    expect(a.__count).toBe(2);
    expect(b.mean_v).toBe(30);
    expect(b.__count).toBe(1);
  });

  it('applies extent + bin + aggregate pipeline', () => {
    const entries = [
      {
        name: 'source_0',
        values: [{ score: 1 }, { score: 5 }, { score: 9 }],
      },
      {
        name: 'data_0',
        source: 'source_0',
        transform: [
          { type: 'extent', field: 'score', signal: 'bin_extent' },
          {
            type: 'bin',
            field: 'score',
            as: ['bin_score', 'bin_score_end'],
            signal: 'bin_params',
            extent: { signal: 'bin_extent' },
            maxbins: 10,
          },
          {
            type: 'aggregate',
            groupby: ['bin_score', 'bin_score_end'],
            ops: ['count'],
            fields: [null],
            as: ['__count'],
          },
          {
            type: 'filter',
            expr: 'isValid(datum["bin_score"]) && isFinite(+datum["bin_score"])',
          },
        ],
      },
    ];
    const store = evaluateVegaData(entries);
    const data = store['data_0']!;
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('bin_score');
    expect(data[0]).toHaveProperty('bin_score_end');
    expect(data[0]).toHaveProperty('__count');
    const total = data.reduce((s, d) => s + d.__count, 0);
    expect(total).toBe(3);
  });

  it('applies formula transform', () => {
    const entries = [
      {
        name: 'source_0',
        values: [{ v: '42' }],
      },
      {
        name: 'data_0',
        source: 'source_0',
        transform: [{ type: 'formula', expr: 'toNumber(datum["v"])', as: 'v' }],
      },
    ];
    const store = evaluateVegaData(entries);
    expect(store['data_0']![0]!.v).toBe(42);
  });

  it('applies timeunit transform', () => {
    const entries = [
      {
        name: 'source_0',
        values: [{ date: '2020-03-15' }],
      },
      {
        name: 'data_0',
        source: 'source_0',
        transform: [
          { type: 'formula', expr: 'toDate(datum["date"])', as: 'date' },
          {
            type: 'timeunit',
            field: 'date',
            units: ['year', 'month'],
            as: ['yearmonth_date', 'yearmonth_date_end'],
          },
        ],
      },
    ];
    const store = evaluateVegaData(entries);
    const d = store['data_0']![0]!;
    expect(d.yearmonth_date).toBeInstanceOf(Date);
    expect((d.yearmonth_date as Date).getFullYear()).toBe(2020);
    expect((d.yearmonth_date as Date).getMonth()).toBe(2);
    expect((d.yearmonth_date as Date).getDate()).toBe(1);
  });

  it('applies stack transform', () => {
    const entries = [
      {
        name: 'source_0',
        values: [
          { g: 'x', cat: 'a', v: 10 },
          { g: 'x', cat: 'b', v: 20 },
        ],
      },
      {
        name: 'data_0',
        source: 'source_0',
        transform: [
          {
            type: 'stack',
            groupby: ['g'],
            field: 'v',
            sort: { field: ['cat'], order: ['ascending'] },
            as: ['v_start', 'v_end'],
            offset: 'zero',
          },
        ],
      },
    ];
    const store = evaluateVegaData(entries);
    const data = store['data_0']!;
    expect(data).toHaveLength(2);
    const a = data.find((d) => d.cat === 'a')!;
    const b = data.find((d) => d.cat === 'b')!;
    expect(a.v_start).toBe(0);
    expect(a.v_end).toBe(10);
    expect(b.v_start).toBe(10);
    expect(b.v_end).toBe(30);
  });

  it('applies impute transform', () => {
    const entries = [
      {
        name: 'source_0',
        values: [
          { g: 'a', k: 1, v: 10 },
          { g: 'b', k: 2, v: 20 },
        ],
      },
      {
        name: 'data_0',
        source: 'source_0',
        transform: [
          {
            type: 'impute',
            field: 'v',
            groupby: ['g'],
            key: 'k',
            method: 'value',
            value: 0,
          },
        ],
      },
    ];
    const store = evaluateVegaData(entries);
    const data = store['data_0']!;
    expect(data).toHaveLength(4);
    const aK2 = data.find((d) => d.g === 'a' && d.k === 2)!;
    expect(aK2.v).toBe(0);
  });
});

describe('extractOutputDatasets', () => {
  it('prefers data_N entries', () => {
    const entries = [
      { name: 'source_0' },
      { name: 'data_0' },
    ];
    const store = {
      source_0: [{ a: 1 }],
      data_0: [{ a: 1, b: 2 }],
    };
    const result = extractOutputDatasets(entries as any, store);
    expect(result).toHaveLength(1);
    expect(result[0]![0]).toHaveProperty('b');
  });

  it('falls back to source_N when no data_N', () => {
    const entries = [{ name: 'source_0' }];
    const store = { source_0: [{ a: 1 }] };
    const result = extractOutputDatasets(entries as any, store);
    expect(result).toHaveLength(1);
  });
});
