export type {
  OlliValue,
  OlliDatum,
  OlliDataset,
  OlliMarkType,
  OlliMarkDef,
  OlliMark,
  MeasureType,
  OlliTimeUnit,
  OlliFieldDef,
  OlliGuide,
  OlliAxis,
  OlliLegend,
  OlliGroupNode,
  OlliPredicateNode,
  OlliAnnotationNode,
  OlliNode,
  OlliNodeType,
  UnitOlliVisSpec,
  MultiSpecOperator,
  MultiOlliVisSpec,
  OlliVisSpec,
  VisPayload,
} from './types.js';
export { isMultiSpec, getMarkType } from './types.js';
export { elaborateSpec } from './elaborate.js';
export { inferStructure } from './infer.js';
