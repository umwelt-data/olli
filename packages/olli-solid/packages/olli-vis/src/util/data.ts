import type { FieldPredicate, LogicalComposition } from 'olli-core';
import { selectionTest } from 'olli-core';
import type { OlliDataset, OlliFieldDef, OlliValue } from '../spec/types.js';
import { dateToTimeUnit, serializeValue } from './values.js';

export function getFieldDef(field: string, fields: OlliFieldDef[]): OlliFieldDef {
  return fields.find((f) => f.field === field) ?? { field };
}

export function getDomain(
  fieldDef: OlliFieldDef,
  data: OlliDataset,
  predicate?: LogicalComposition<FieldPredicate>,
): OlliValue[] {
  const dataset = predicate ? selectionTest(data, predicate) : data;
  const unique = new Set<OlliValue>();

  if (fieldDef.timeUnit) {
    const seen = new Set<string>();
    for (const d of dataset) {
      const v = d[fieldDef.field];
      if (v instanceof Date) {
        const key = dateToTimeUnit(v, fieldDef.timeUnit);
        if (!seen.has(key)) {
          seen.add(key);
          unique.add(v);
        }
      }
    }
  } else {
    const seenTimes = new Set<number>();
    for (const d of dataset) {
      const v = d[fieldDef.field];
      if (v == null) continue;
      if (v instanceof Date) {
        const t = v.getTime();
        if (!seenTimes.has(t)) {
          seenTimes.add(t);
          unique.add(v);
        }
      } else {
        unique.add(v);
      }
    }
  }

  return [...unique]
    .filter((x) => x != null)
    .sort((a, b) => {
      if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
      if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
      return (a as number) - (b as number);
    });
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
  } else if (fieldDef.bin && field.startsWith('bin_')) {
    return domain.map((v) => {
      const end = data.find((d) => d[field] === v)?.[field + '_end'];
      return [Number(v), Number(end)] as [number, number];
    });
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
  if (domMin < tickValues[0]!) bins.push([domMin, tickValues[0]!]);
  for (let i = 0; i < tickValues.length - 1; i++) {
    bins.push([tickValues[i]!, tickValues[i + 1]!]);
  }
  if (domMax > tickValues[tickValues.length - 1]!) {
    bins.push([tickValues[tickValues.length - 1]!, domMax]);
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
): Array<FieldPredicate & { inclusive?: boolean }> {
  const bins = getBins(field, data, fields, ticks);
  return bins.map((bin, idx) => ({
    field,
    range: bin as [number, number],
    inclusive: idx === bins.length - 1,
  }));
}

export function fieldToPredicates(
  field: string,
  data: OlliDataset,
  fields: OlliFieldDef[],
  ticks?: OlliValue[],
): FieldPredicate[] {
  const fieldDef = getFieldDef(field, fields);
  if (
    fieldDef.type === 'nominal' ||
    fieldDef.type === 'ordinal' ||
    fieldDef.timeUnit
  ) {
    const domain = getDomain(fieldDef, data);
    return domain.map((value) => ({
      field,
      equal: serializeValue(value, fieldDef) as number | string | boolean,
    }));
  }
  return getBinPredicates(field, data, fields, ticks);
}
