import type { FieldPredicate, LogicalComposition } from 'olli-core';
import type { OlliFieldDef, OlliValue } from '../spec/types.js';
import { fmtDataValue, wrapForMonospace } from '../util/values.js';
import { getFieldDef } from '../util/data.js';

export function predicateToDescription(
  predicate: LogicalComposition<FieldPredicate>,
  fields: OlliFieldDef[],
): string {
  if ('and' in predicate) {
    return predicate.and
      .map((p) => predicateToDescription(p, fields))
      .filter((s) => s.trim().length > 0)
      .join(' and ');
  }
  if ('or' in predicate) {
    return predicate.or.map((p) => predicateToDescription(p, fields)).join(' or ');
  }
  if ('not' in predicate) {
    return `not ${predicateToDescription(predicate.not, fields)}`;
  }
  return fieldPredicateToDescription(predicate, fields);
}

function fieldPredicateToDescription(pred: FieldPredicate, fields: OlliFieldDef[]): string {
  const fd = getFieldDef(pred.field, fields);
  const label = wrapForMonospace(fd.label ?? fd.field);
  if ('equal' in pred) return `${label} equals ${fmtDataValue(pred.equal as OlliValue, fd)}`;
  if ('range' in pred) {
    const [lo, hi] = pred.range as [number, number];
    return `${label} is between ${fmtDataValue(lo, fd)} and ${fmtDataValue(hi, fd)}`;
  }
  if ('lt' in pred) return `${label} is less than ${fmtDataValue(pred.lt as OlliValue, fd)}`;
  if ('lte' in pred) return `${label} is less than or equal to ${fmtDataValue(pred.lte as OlliValue, fd)}`;
  if ('gt' in pred) return `${label} is greater than ${fmtDataValue(pred.gt as OlliValue, fd)}`;
  if ('gte' in pred) return `${label} is greater than or equal to ${fmtDataValue(pred.gte as OlliValue, fd)}`;
  if ('oneOf' in pred) {
    return `${label} is one of ${pred.oneOf.map((v) => fmtDataValue(v as OlliValue, fd)).join(', ')}`;
  }
  return '';
}
