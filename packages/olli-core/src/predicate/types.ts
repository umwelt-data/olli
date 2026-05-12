// Minimal vendored predicate types, structurally compatible with vega-lite's
// LogicalComposition<FieldPredicate>. No vega runtime dependency.

export type FieldValue = string | number | boolean | Date | null;

export interface FieldPredicateBase {
  field: string;
  timeUnit?: string;
}

export interface FieldEqualPredicate extends FieldPredicateBase {
  equal: FieldValue;
}

export interface FieldLTPredicate extends FieldPredicateBase {
  lt: FieldValue;
}

export interface FieldGTPredicate extends FieldPredicateBase {
  gt: FieldValue;
}

export interface FieldLTEPredicate extends FieldPredicateBase {
  lte: FieldValue;
}

export interface FieldGTEPredicate extends FieldPredicateBase {
  gte: FieldValue;
}

export interface FieldRangePredicate extends FieldPredicateBase {
  range: [number, number] | [Date, Date];
  /** Whether both endpoints are inclusive. Defaults to true. */
  inclusive?: boolean;
}

export interface FieldOneOfPredicate extends FieldPredicateBase {
  oneOf: FieldValue[];
}

export interface FieldValidPredicate extends FieldPredicateBase {
  valid: boolean;
}

export type FieldPredicate =
  | FieldEqualPredicate
  | FieldLTPredicate
  | FieldGTPredicate
  | FieldLTEPredicate
  | FieldGTEPredicate
  | FieldRangePredicate
  | FieldOneOfPredicate
  | FieldValidPredicate;

export interface LogicalAnd<T> {
  and: LogicalComposition<T>[];
}

export interface LogicalOr<T> {
  or: LogicalComposition<T>[];
}

export interface LogicalNot<T> {
  not: LogicalComposition<T>;
}

export type LogicalComposition<T> = T | LogicalAnd<T> | LogicalOr<T> | LogicalNot<T>;

export type Selection = LogicalComposition<FieldPredicate>;

export function isLogicalAnd<T>(p: LogicalComposition<T>): p is LogicalAnd<T> {
  return typeof p === 'object' && p !== null && 'and' in p;
}

export function isLogicalOr<T>(p: LogicalComposition<T>): p is LogicalOr<T> {
  return typeof p === 'object' && p !== null && 'or' in p;
}

export function isLogicalNot<T>(p: LogicalComposition<T>): p is LogicalNot<T> {
  return typeof p === 'object' && p !== null && 'not' in p;
}

export function isFieldPredicate(p: unknown): p is FieldPredicate {
  return typeof p === 'object' && p !== null && 'field' in p;
}

export const EMPTY_AND: LogicalAnd<FieldPredicate> = { and: [] };
