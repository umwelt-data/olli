import type { FieldPredicate, FieldRangePredicate, LogicalComposition } from 'olli-core';
import { selectionTest } from 'olli-core';
import type { OlliDataset, OlliFieldDef, OlliValue } from '../spec/types.js';
import { serializeValue, getDomain as sharedGetDomain } from '@umwelt-data/umwelt-utils/data';

export function getFieldDef(field: string, fields: OlliFieldDef[]): OlliFieldDef {
  return fields.find((f) => f.field === field) ?? { field };
}

export function getDomain(
  fieldDef: OlliFieldDef,
  data: OlliDataset,
  predicate?: LogicalComposition<FieldPredicate>,
): OlliValue[] {
  const dataset = predicate ? selectionTest(data, predicate) : data;
  return sharedGetDomain(fieldDef, dataset) as OlliValue[];
}

/**
 * Simple equal-width binning without external dependencies.
 * Approximates vega-statistics bin({maxbins, extent}).
 */
export function getBins(
  field: string,
  data: OlliDataset,
  fields: OlliFieldDef[],
  ticks?: OlliValue[],
): [number, number][] {
  const fieldDef = getFieldDef(field, fields);
  const domain = getDomain(fieldDef, data);
  if (domain.length === 0) return [];

  if (fieldDef.bin && field.startsWith('bin_')) {
    return domain.map((v) => {
      const end = data.find((d) => d[field] === v)?.[field + '_end'];
      return [Number(v), Number(end)] as [number, number];
    });
  }

  let tickValues: number[] | undefined;

  if (ticks) {
    tickValues = ticks.map(Number).filter((n) => !isNaN(n));
  } else if (fieldDef.type === 'temporal') {
    const min = Number(domain[0]);
    const max = Number(domain[domain.length - 1]!);
    const n = 6;
    const step = (max - min) / n;
    tickValues = [];
    for (let i = 0; i <= n; i++) tickValues.push(min + step * i);
  } else {
    const min = Number(domain[0]);
    const max = Number(domain[domain.length - 1]!);
    const step = niceStep(min, max, 10);
    const start = Math.floor(min / step) * step;
    const stop = Math.ceil(max / step) * step;
    tickValues = [];
    for (let v = start; v <= stop + step * 0.001; v += step) tickValues.push(v);
  }

  const domMin = Number(domain[0]);
  const domMax = Number(domain[domain.length - 1]!);
  tickValues = tickValues.filter((t) => t >= domMin && t <= domMax);
  if (tickValues.length === 0) return [];

  const bins: [number, number][] = [];
  for (let i = 0; i < tickValues.length - 1; i++) {
    bins.push([tickValues[i]!, tickValues[i + 1]!]);
  }
  if (bins.length > 0) {
    if (domMin < bins[0]![0]) bins[0]![0] = domMin;
    if (domMax > bins[bins.length - 1]![1]) bins[bins.length - 1]![1] = domMax;
  }
  return bins;
}

function niceStep(min: number, max: number, maxBins: number): number {
  const range = max - min;
  if (range === 0) return 1;
  const rawStep = range / maxBins;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / mag;
  let nice: number;
  if (residual <= 1.5) nice = 1;
  else if (residual <= 3) nice = 2;
  else if (residual <= 7) nice = 5;
  else nice = 10;
  return nice * mag;
}

export function getBinPredicates(
  field: string,
  data: OlliDataset,
  fields: OlliFieldDef[],
  ticks?: OlliValue[],
): FieldRangePredicate[] {
  const bins = getBins(field, data, fields, ticks);
  return bins.map((bin, idx) => ({
    field,
    range: bin as [number, number],
    inclusiveLeft: true,
    inclusiveRight: idx === bins.length - 1,
  }));
}

export function fieldToPredicates(
  field: string,
  data: OlliDataset,
  fields: OlliFieldDef[],
  ticks?: OlliValue[],
): FieldPredicate[] {
  const fieldDef = getFieldDef(field, fields);
  if (fieldDef.type === 'nominal' || fieldDef.type === 'ordinal') {
    const domain = getDomain(fieldDef, data);
    if (ticks?.length) {
      // follow the chart's tick order (e.g. sort: null keeps data order)
      const order = new Map(ticks.map((t, i) => [String(t), i]));
      domain.sort((a, b) => (order.get(String(a)) ?? Infinity) - (order.get(String(b)) ?? Infinity));
    }
    return domain.map((value) => ({
      field,
      equal: serializeValue(value, fieldDef) as number | string | boolean,
    }));
  }
  return getBinPredicates(field, data, fields, ticks);
}
