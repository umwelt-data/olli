import type {
  FieldPredicate,
  LogicalComposition,
  Selection,
} from './types.js';
import {
  isFieldPredicate,
  isLogicalAnd,
  isLogicalNot,
  isLogicalOr,
} from './types.js';

export type Datum = Record<string, unknown>;

export function testDatum(datum: Datum, predicate: Selection): boolean {
  if (isLogicalAnd(predicate)) {
    return predicate.and.every((p) => testDatum(datum, p));
  }
  if (isLogicalOr(predicate)) {
    return predicate.or.some((p) => testDatum(datum, p));
  }
  if (isLogicalNot(predicate)) {
    return !testDatum(datum, predicate.not);
  }
  if (isFieldPredicate(predicate)) {
    return testField(datum, predicate);
  }
  return true;
}

export function selectionTest<T extends Datum>(data: readonly T[], predicate: Selection): T[] {
  return data.filter((d) => testDatum(d, predicate));
}

function testField(datum: Datum, predicate: FieldPredicate): boolean {
  const value = datum[predicate.field];
  if ('equal' in predicate) return eq(value, predicate.equal);
  if ('lt' in predicate) return cmp(value, predicate.lt) < 0;
  if ('gt' in predicate) return cmp(value, predicate.gt) > 0;
  if ('lte' in predicate) return cmp(value, predicate.lte) <= 0;
  if ('gte' in predicate) return cmp(value, predicate.gte) >= 0;
  if ('range' in predicate) {
    const [lo, hi] = predicate.range;
    const inclusive = predicate.inclusive ?? true;
    const a = cmp(value, lo);
    const b = cmp(value, hi);
    if (inclusive) return a >= 0 && b <= 0;
    return a > 0 && b < 0;
  }
  if ('oneOf' in predicate) {
    return predicate.oneOf.some((v) => eq(value, v));
  }
  if ('valid' in predicate) {
    const isValid =
      value !== null && value !== undefined && !(typeof value === 'number' && Number.isNaN(value));
    return predicate.valid ? isValid : !isValid;
  }
  return true;
}

function numericize(v: unknown): number | undefined {
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  if (typeof v === 'boolean') return v ? 1 : 0;
  return undefined;
}

function eq(a: unknown, b: unknown): boolean {
  if (a instanceof Date || b instanceof Date) {
    const an = numericize(a), bn = numericize(b);
    return an !== undefined && bn !== undefined && an === bn;
  }
  if (typeof a === typeof b) return a === b;
  const an = numericize(a), bn = numericize(b);
  if (an !== undefined && bn !== undefined) return an === bn;
  return a === b;
}

function cmp(a: unknown, b: unknown): number {
  const an = numericize(a);
  const bn = numericize(b);
  if (an !== undefined && bn !== undefined) {
    if (an < bn) return -1;
    if (an > bn) return 1;
    return 0;
  }
  const as = String(a), bs = String(b);
  if (as < bs) return -1;
  if (as > bs) return 1;
  return 0;
}
