import type { FieldPredicate, LogicalComposition, Selection } from 'olli-core';

// ---- Value types ----

export type OlliValue = string | number | Date;
export type OlliDatum = Record<string, OlliValue>;
export type OlliDataset = OlliDatum[];
export type OlliMarkType = 'point' | 'bar' | 'line' | 'area' | 'rect' | 'tick' | 'arc';

export interface OlliMarkDef {
  type: OlliMarkType;
  innerRadius?: number;
  stack?: 'stacked' | 'grouped';
}

export type OlliMark = OlliMarkType | OlliMarkDef;

export function getMarkType(mark?: OlliMark): OlliMarkType | undefined {
  if (!mark) return undefined;
  return typeof mark === 'string' ? mark : mark.type;
}

// ---- Field definitions ----

export type MeasureType = 'quantitative' | 'ordinal' | 'nominal' | 'temporal';
export type OlliTimeUnit = 'year' | 'month' | 'day' | 'date' | 'hours' | 'minutes' | 'seconds';

export interface OlliFieldDef {
  field: string;
  label?: string;
  type?: MeasureType;
  timeUnit?: OlliTimeUnit;
  bin?: boolean;
}

// ---- Guides (axes, legends) ----

export interface OlliGuide {
  field: string;
  title?: string;
  channel?: string;
}

export interface OlliAxis extends OlliGuide {
  axisType: 'x' | 'y';
  scaleType?: string;
  ticks?: OlliValue[];
}

export interface OlliLegend extends OlliGuide {
  channel: 'color' | 'opacity' | 'size';
}

// ---- Structure nodes ----

export interface OlliGroupNode {
  groupby: string;
  children?: OlliNode[];
}

export interface OlliPredicateNode {
  predicate: LogicalComposition<FieldPredicate>;
  name?: string;
  reasoning?: string;
  children?: OlliNode[];
}

export interface OlliAnnotationNode {
  annotations: OlliNode[];
}

export type OlliNode = OlliGroupNode | OlliPredicateNode | OlliAnnotationNode;

// ---- Node types (roles) ----

export type OlliNodeType =
  | 'root'
  | 'view'
  | 'xAxis'
  | 'yAxis'
  | 'legend'
  | 'guide'
  | 'filteredData'
  | 'annotations'
  | 'other';

// ---- Spec types ----

export interface UnitOlliVisSpec {
  data: OlliDataset;
  fields?: OlliFieldDef[];
  structure?: OlliNode | OlliNode[];
  mark?: OlliMark;
  axes?: OlliAxis[];
  legends?: OlliLegend[];
  guides?: OlliGuide[];
  facet?: string;
  selection?: Selection;
  title?: string;
  description?: string;
}

export type MultiSpecOperator = 'layer' | 'concat';

export interface MultiOlliVisSpec {
  operator: MultiSpecOperator;
  units: UnitOlliVisSpec[];
}

export type OlliVisSpec = UnitOlliVisSpec | MultiOlliVisSpec;

export function isMultiSpec(spec: OlliVisSpec): spec is MultiOlliVisSpec {
  return 'operator' in spec;
}

// ---- Payload for hyperedges ----

export interface VisPayload {
  nodeType: OlliNodeType;
  predicate?: FieldPredicate | undefined;
  groupby?: string | undefined;
  specIndex?: number | undefined;
  viewType?: 'facet' | 'layer' | 'concat' | undefined;
  spec: UnitOlliVisSpec;
}
