import { LogicalAnd } from 'vega-lite/src/logical';
import { OlliNode } from './Structure/Types';
import { FieldPredicate } from 'vega-lite/src/predicate';

export type OlliValue = string | number | Date;

export interface OlliDatum {
  [key: string]: OlliValue;
}

export type OlliDataset = OlliDatum[];

export type OlliMark = 'point' | 'bar' | 'line' | 'geoshape';

/**
 * Spec describing a visualization
 */
export interface UnitOlliSpec {
  // required: data
  data: OlliDataset;
  // semi-required: specification of the fields/typings (inferred from data if not provided)
  fields?: OlliFieldDef[];
  // semi-required: structure (inferred from fields if not provided)
  structure?: OlliNode | OlliNode[];
  // optional information about the chart's visual encodings for descriptions
  mark?: OlliMark;
  axes?: OlliAxis[];
  legends?: OlliLegend[];
  guides?: OlliGuide[]; // generic guides that aren't axes / legends (e.g. order)
  facet?: string;
  // an optional initial top level selection query
  selection?: LogicalAnd<FieldPredicate> | FieldPredicate;
  // additional optional info used for description
  title?: string;
  description?: string;
}

export type MultiSpecOperator = 'layer' | 'concat';

export interface MultiOlliSpec {
  operator: MultiSpecOperator;
  units: UnitOlliSpec[];
}

export const isMultiOlliSpec = (spec: OlliSpec): spec is MultiOlliSpec => {
  return 'operator' in spec;
};

export type OlliSpec = UnitOlliSpec | MultiOlliSpec;

export type OlliGuide = {
  field: string;
  title?: string; // optional human-readable title used for description
  channel?: string;
};

/**
 * Extending the {@link OlliGuide} interface for visualization axes
 */
export interface OlliAxis extends OlliGuide {
  axisType: 'x' | 'y';
  scaleType?: string; // e.g. linear, logarithmic, band
  ticks?: OlliValue[]; // axis tick values to use as bins
}

/**
 * Extending the {@link OlliGuide} interface for visualization legends
 */
export interface OlliLegend extends OlliGuide {
  channel: 'color' | 'opacity' | 'size';
}

export type MeasureType = 'quantitative' | 'ordinal' | 'nominal' | 'temporal';
export type OlliTimeUnit = 'year' | 'month' | 'day' | 'date' | 'hours' | 'minutes' | 'seconds';

export interface OlliFieldDef {
  field: string;
  label?: string; // human-readable field name used for description
  type?: MeasureType; // optional, but will be inferred if not provided
  timeUnit?: OlliTimeUnit;
  bin?: boolean;
}

/**
 * Interface describing how a visualization adapter should be created
 */
export type VisAdapter<T> = (spec: T) => Promise<OlliSpec>;
