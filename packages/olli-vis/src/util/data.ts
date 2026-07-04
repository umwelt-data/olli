import type { FieldPredicate, FieldRangePredicate, LogicalComposition } from 'olli-core';
import { selectionTest } from 'olli-core';
import type { OlliDataset, OlliFieldDef, OlliValue } from '../spec/types.js';
import { serializeValue, getBins, getDomain as sharedGetDomain } from '@umwelt-data/umwelt-utils/data';

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

export function getBinPredicates(
  field: string,
  data: OlliDataset,
  fields: OlliFieldDef[],
  ticks?: OlliValue[],
): FieldRangePredicate[] {
  const bins = getBins(getFieldDef(field, fields), data, ticks);
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
