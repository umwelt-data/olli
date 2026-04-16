export type {
  FieldValue,
  FieldPredicateBase,
  FieldEqualPredicate,
  FieldLTPredicate,
  FieldGTPredicate,
  FieldLTEPredicate,
  FieldGTEPredicate,
  FieldRangePredicate,
  FieldOneOfPredicate,
  FieldValidPredicate,
  FieldPredicate,
  LogicalAnd,
  LogicalOr,
  LogicalNot,
  LogicalComposition,
  Selection,
} from './types.js';
export {
  isLogicalAnd,
  isLogicalOr,
  isLogicalNot,
  isFieldPredicate,
  EMPTY_AND,
} from './types.js';
export { selectionTest, testDatum } from './eval.js';
export type { Datum } from './eval.js';
