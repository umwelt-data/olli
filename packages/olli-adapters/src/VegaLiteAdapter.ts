import type { UnitOlliVisSpec, OlliVisSpec, OlliDataset, OlliAxis, OlliLegend, OlliMark } from 'olli-vis';
import { getMarkType } from 'olli-vis/spec/types';
import { typeInference, typeCoerceData, inferFormatFromUrl, parseDelimited, fetchAndParse } from '@umwelt-data/umwelt-utils/data';
import { describeField } from '@umwelt-data/umwelt-utils/description';
import { evaluateVegaData, extractOutputDatasets } from '@umwelt-data/umwelt-utils/vega';
import { filterExprToPredicates } from '@umwelt-data/umwelt-utils/predicate';
import { computeGuideTicks } from '@umwelt-data/umwelt-utils/vega';
import type { GuideTicksConfig } from '@umwelt-data/umwelt-utils/vega';
import type { VisAdapter } from './types.js';
import { enrichWithUSGeo, looksLikeFips, regionForUSState } from '@umwelt-data/umwelt-utils/geo';
import { compile } from 'vega-lite';

function getDatasets(dataEntries: any[], store: Record<string, any[]>): OlliDataset[] {
  const leafNames = findLeafDatasets(dataEntries);
  if (leafNames.length) {
    const datasets = leafNames
      .map((name) => store[name])
      .filter((d): d is Record<string, any>[] => !!d && d.length > 0 && !!d[0] && Object.keys(d[0]).length > 0);
    const deduped = datasets.filter((d, idx, self) => {
      return (
        self.findLastIndex(
          (d2) => d2.length > 0 && d2[0] && Object.keys(d2[0]!).every((k) => Object.keys(d[0]!).includes(k)),
        ) === idx
      );
    });
    if (deduped.length) return deduped as OlliDataset[];
  }
  return extractOutputDatasets(dataEntries, store) as OlliDataset[];
}

function findLeafDatasets(dataEntries: any[]): string[] {
  const sourcedBy = new Set<string>();
  for (const entry of dataEntries) {
    if (entry.source) sourcedBy.add(entry.source);
  }
  return dataEntries
    .map((e) => e.name)
    .filter((name) => /^(source|data)_\d+$/.test(name) && !sourcedBy.has(name));
}

interface CompiledMarkEntry {
  name: string;
  dataName?: string;
}

// The compiled Vega spec retains the exact view -> dataset correspondence:
// leaf mark names encode the composition path (e.g. concat_0_layer_1_marks)
// and each data-driven mark declares its source via from.data. Walk the mark
// tree collecting that mapping, plus group-scoped data definitions and
// aliases for facet/pathgroup partition names (a partition of a dataset is,
// for our purposes, the full dataset — faceting is handled by field).
function collectCompiledMarks(marks: any[]): { markEntries: CompiledMarkEntry[]; scopedData: any[] } {
  const markEntries: CompiledMarkEntry[] = [];
  const scopedData: any[] = [];

  const walk = (ms: any[]) => {
    for (const m of ms ?? []) {
      if (m.from?.facet?.name && m.from?.facet?.data) {
        scopedData.push({ name: m.from.facet.name, source: m.from.facet.data });
      }
      if (Array.isArray(m.data)) {
        scopedData.push(...m.data);
      }
      if (typeof m.name === 'string' && m.name.endsWith('_marks')) {
        markEntries.push({ name: m.name, dataName: m.from?.data });
      }
      if (Array.isArray(m.marks)) {
        walk(m.marks);
      }
    }
  };

  walk(marks);
  return { markEntries, scopedData };
}

interface ResolvedLeafDataset {
  dataset: OlliDataset;
  // the compiled data entry feeding this leaf's mark (carries its transforms)
  dataEntry?: any;
}

type LeafDatasetResolver = (path: string) => ResolvedLeafDataset | undefined;

function makeLeafDatasetResolver(
  markEntries: CompiledMarkEntry[],
  store: Record<string, any[]>,
  dataEntries: any[],
): LeafDatasetResolver {
  const entryByName = new Map(dataEntries.map((e: any) => [e.name, e]));
  return (path: string) => {
    const entry = markEntries.find((e) => e.name === `${path}_marks` || e.name.startsWith(`${path}_`));
    if (!entry?.dataName) return undefined;
    const dataset = store[entry.dataName];
    if (!dataset?.length) return undefined;
    return { dataset: dataset as OlliDataset, dataEntry: entryByName.get(entry.dataName) };
  };
}

export function VegaLiteAdapterSync(spec: any): OlliVisSpec {
  const vegaSpec = compile(spec).spec;
  const { markEntries, scopedData } = collectCompiledMarks(vegaSpec.marks ?? []);
  const topLevelNames = new Set((vegaSpec.data ?? []).map((e: any) => e.name));
  const dataEntries = [
    ...(vegaSpec.data ?? []),
    ...scopedData.filter((e) => !topLevelNames.has(e.name)),
  ];
  const store = evaluateVegaData(dataEntries);
  const data = getDatasets(dataEntries, store);

  if ('repeat' in spec && 'spec' in spec) {
    return adaptRepeatSpec(spec, data, makeLeafDatasetResolver(markEntries, store, dataEntries));
  }

  if ('facet' in spec && 'spec' in spec && !('mark' in spec)) {
    return adaptFacetSpec(spec, data);
  }

  if ('mark' in spec) {
    const normalized = normalizeOverlayMark(spec);
    return adaptUnitSpec(normalized, data[0]!);
  }

  if ('layer' in spec || 'concat' in spec || 'hconcat' in spec || 'vconcat' in spec) {
    const vlOp = getCompositeOp(spec)!;
    return adaptMultiSpec(spec, vlOp, data, makeLeafDatasetResolver(markEntries, store, dataEntries));
  }

  return adaptUnitSpec(spec, data[0]!);
}

async function resolveData(spec: any): Promise<any> {
  let result = { ...spec };

  const data = result.data;
  if (data?.url && !data.values) {
    const parsed = await fetchAndParse(data.url, data.format);
    const isTopojson = data.format?.type === 'topojson';
    result = {
      ...result,
      data: {
        ...data,
        values: isTopojson ? parsed : Array.isArray(parsed) ? parsed : [parsed],
        url: undefined,
      },
    };
  }

  if (result.transform) {
    const transforms = [...result.transform];
    for (let i = 0; i < transforms.length; i++) {
      const t = transforms[i];
      if (t?.lookup && t.from?.data?.url && !t.from.data.values) {
        const parsed = await fetchAndParse(t.from.data.url, t.from.data.format);
        transforms[i] = {
          ...t,
          from: {
            ...t.from,
            data: { ...t.from.data, values: Array.isArray(parsed) ? parsed : [parsed], url: undefined },
          },
        };
      }
    }
    result = { ...result, transform: transforms };
  }

  // child views can carry their own data.url
  if (result.spec) {
    result = { ...result, spec: await resolveData(result.spec) };
  }
  for (const op of ['layer', 'concat', 'hconcat', 'vconcat']) {
    if (Array.isArray(result[op])) {
      result = { ...result, [op]: await Promise.all(result[op].map((v: any) => resolveData(v))) };
    }
  }

  return result;
}

export const VegaLiteAdapter: VisAdapter<any> = async (spec: any): Promise<OlliVisSpec> => {
  const resolved = await resolveData(spec);
  return VegaLiteAdapterSync(resolved);
};

function normalizeOverlayMark(spec: any): any {
  const mark = spec.mark;
  if (mark && typeof mark === 'object' && (mark.point || mark.line)) {
    const { point, line, ...rest } = mark;
    return { ...spec, mark: Object.keys(rest).length === 1 && 'type' in rest ? rest.type : rest };
  }
  return spec;
}

function getFacetField(facetDef: any): string | undefined {
  if (facetDef.field) return facetDef.field;
  if (facetDef.row) return facetDef.row.field;
  if (facetDef.column) return facetDef.column.field;
  return undefined;
}

function resolveInnerSpec(spec: any): { innerSpec: any; facetFields: string[] } {
  const facetFields: string[] = [];
  let current = spec;
  while ('facet' in current && 'spec' in current && !('mark' in current) && !('layer' in current)) {
    const f = getFacetField(current.facet);
    if (f) facetFields.push(f);
    current = { ...current.spec, data: current.spec.data || current.data, description: current.description || current.spec.description };
  }
  return { innerSpec: current, facetFields };
}

function adaptFacetSpec(spec: any, data: OlliDataset[]): OlliVisSpec {
  const { innerSpec, facetFields } = resolveInnerSpec(spec);

  if ('mark' in innerSpec) {
    const result = adaptUnitSpec(normalizeOverlayMark(innerSpec), data[0]!);
    if (facetFields.length && !result.facet) result.facet = facetFields[0]!;
    return result;
  }

  if ('layer' in innerSpec) {
    return adaptMultiSpec(innerSpec, 'layer', data);
  }

  return adaptUnitSpec(innerSpec, data[0]!);
}

function adaptRepeatSpec(spec: any, data: OlliDataset[], resolveLeafDataset?: LeafDatasetResolver): OlliVisSpec {
  const repeatDef = spec.repeat;
  const repeatValues: string[] = Array.isArray(repeatDef)
    ? repeatDef
    : [...(repeatDef.row || []), ...(repeatDef.column || []), ...(repeatDef.layer || [])];

  const units: UnitOlliVisSpec[] = [];
  const usedDatasets = new Set<number>();
  const isLayerRepeat = !Array.isArray(repeatDef) && repeatDef.layer;

  // compiled mark names prefix repeat children as child__<kind>_<value>;
  // row+column grids combine both values, which the flattened repeatValues
  // loop doesn't model, so leave those to fallback matching
  const repeatKind = Array.isArray(repeatDef)
    ? ''
    : repeatDef.layer ? 'layer_'
    : repeatDef.row && repeatDef.column ? null
    : repeatDef.row ? 'row_'
    : 'column_';

  for (const value of repeatValues) {
    const inner = JSON.parse(JSON.stringify(spec.spec));
    resolveRepeatRefs(inner, value);
    const innerSpec = normalizeOverlayMark(inner);
    const basePath = repeatKind != null ? `child__${repeatKind}${String(value).replace(/\W/g, '_')}` : undefined;

    if ('layer' in innerSpec) {
      const unit = adaptRepeatLayerUnit(innerSpec, data, basePath, resolveLeafDataset);
      if (unit) units.push(unit);
    } else if ('mark' in innerSpec) {
      const datasetIdx = data.findIndex((d, i) => {
        if (!isLayerRepeat && usedDatasets.has(i)) return false;
        if (!d?.length || !d[0]) return false;
        const fields = Object.keys(d[0]);
        if (innerSpec.encoding) {
          const viewFields = Object.values(innerSpec.encoding)
            .map((f: any) => getFieldFromEncoding(f, d))
            .filter((f): f is string => !!f);
          return viewFields.length > 0 && viewFields.every((f) => fields.includes(f));
        }
        return false;
      });
      const dataset = datasetIdx >= 0 ? data[datasetIdx]! : data[0]!;
      if (datasetIdx >= 0) usedDatasets.add(datasetIdx);
      units.push(adaptUnitSpec(innerSpec, dataset));
    }
  }

  if (units.length === 1) return units[0]!;
  const operator = !Array.isArray(repeatDef) && repeatDef.layer ? 'layer' : 'concat';
  return { operator, units };
}

// a layered chart inside a repeat becomes one merged unit per repeat value
function adaptRepeatLayerUnit(
  innerSpec: any,
  data: OlliDataset[],
  basePath: string | undefined,
  resolveLeafDataset?: LeafDatasetResolver,
): UnitOlliVisSpec | undefined {
  const { leaves } = flattenCompositeViews(innerSpec, 'layer');
  let unit: UnitOlliVisSpec | undefined;

  for (const { view, encoding, path } of leaves) {
    if (!Object.keys(encoding).length) continue;

    let dataset = basePath && resolveLeafDataset ? resolveLeafDataset(`${basePath}_${path}`)?.dataset : undefined;
    if (dataset && !Object.values(encoding).some((f: any) => getFieldFromEncoding(f, dataset!))) continue;
    if (!dataset) {
      dataset = data.find((d) => {
        if (!d?.length) return false;
        const fields = Object.keys(d[0]!);
        const viewFields = Object.values(encoding)
          .map((f: any) => getFieldFromEncoding(f, d))
          .filter((f): f is string => !!f);
        return viewFields.length > 0 && viewFields.every((f) => fields.includes(f));
      });
    }
    if (!dataset) continue;

    const viewOlliSpec = adaptUnitSpec({ mark: view.mark, encoding, description: innerSpec.description }, dataset);
    if (!unit) {
      unit = { description: innerSpec.description, data: dataset, fields: [], axes: [], legends: [], guides: [] };
    } else if (dataset.length > unit.data.length) {
      unit.data = dataset;
    }
    unit.fields!.push(...(viewOlliSpec.fields ?? []));
    unit.axes!.push(...(viewOlliSpec.axes ?? []));
    unit.legends!.push(...(viewOlliSpec.legends ?? []));
    unit.guides!.push(...(viewOlliSpec.guides ?? []));
    if (viewOlliSpec.mark !== undefined
      && (unit.mark === undefined || markPrecedence(viewOlliSpec.mark) > markPrecedence(unit.mark))) {
      unit.mark = viewOlliSpec.mark;
    }
    if (viewOlliSpec.facet && !unit.facet) unit.facet = viewOlliSpec.facet;
  }

  if (unit) {
    unit.fields = unit.fields!.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);
    unit.axes = unit.axes!.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);
    unit.legends = unit.legends!.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);
    unit.guides = unit.guides!.filter((g, i, self) => self.findIndex((g2) => g2.field === g.field) === i);
    coerceData(unit);
  }
  return unit;
}

function resolveRepeatRefs(obj: any, value: string): void {
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (v && typeof v === 'object') {
      if ('repeat' in v && Object.keys(v).length === 1) {
        obj[key] = value;
      } else if (v.field && typeof v.field === 'object' && 'repeat' in v.field) {
        v.field = value;
      } else if (v.datum && typeof v.datum === 'object' && 'repeat' in v.datum) {
        v.datum = value;
      } else {
        resolveRepeatRefs(v, value);
      }
    }
  }
}

function getFieldFromEncoding(encoding: any, data: OlliDataset): string | undefined {
  if ('aggregate' in encoding) {
    if (encoding.aggregate === 'count') {
      return `__${encoding.aggregate}`;
    }
    if (typeof encoding.aggregate === 'object' && encoding.aggregate !== null) {
      // argmax/argmin refs ({aggregate: {argmax: 'x'}, field: 'y'}) point into
      // a row-valued column; there is no flat field to resolve
      return undefined;
    }
    return `${encoding.aggregate}_${encoding.field}`;
  }
  if ('timeUnit' in encoding) {
    return `${encoding.timeUnit}_${encoding.field}`;
  }
  if ('bin' in encoding && encoding.bin === true && data.length) {
    const fields = Object.keys(data[0]!);
    const binField = fields.find((f) => f.startsWith('bin') && f.includes(encoding.field) && !f.endsWith('_end'));
    return binField;
  }

  return 'condition' in encoding ? encoding.condition.field : encoding.field;
}

function getLabelFromEncoding(encoding: any): string {
  return describeField({
    field: 'condition' in encoding ? encoding.condition.field : encoding.field,
    bin: encoding.bin,
    aggregate: encoding.aggregate,
    timeUnit: encoding.timeUnit !== encoding.field?.toLowerCase() ? encoding.timeUnit : undefined,
  });
}

// scale.domain may be a param ref ({param: ...}) or 'unaggregated'; only array
// domains are meaningful for tick computation
function asArrayDomain(domain: unknown): any {
  return Array.isArray(domain) ? domain : undefined;
}

// distinguishes field-bearing encodings from value-only ones
// (e.g. color: {value: 'red'})
function isFieldDef(enc: any): boolean {
  return !!enc && typeof enc === 'object' && !!(enc.field || enc.condition?.field || enc.aggregate || enc.bin || enc.timeUnit);
}

// color/detail drives stacking only when it partitions marks into multiple
// segments; coloring by the categorical positional field itself yields one
// segment per bar (a plain bar chart, e.g. y=weather, x=count, color=weather)
function hasStackingColorOrDetail(encoding: any): boolean {
  const stackEnc = [encoding.color, encoding.detail].find(isFieldDef);
  if (!stackEnc) return false;
  const stackField = stackEnc.field ?? stackEnc.condition?.field;
  if (!stackField) return true;
  for (const ch of ['x', 'y'] as const) {
    const posEnc = encoding[ch];
    if (!posEnc || posEnc.aggregate || posEnc.type === 'quantitative') continue;
    if ((posEnc.field ?? posEnc.condition?.field) === stackField) return false;
  }
  return true;
}

// annotation marks (labels, threshold rules) should not displace a chart's
// primary mark when layers merge into one unit
function markPrecedence(mark: OlliMark | undefined): number {
  // raw vega-lite mark types pass through getMark, so marks beyond
  // OlliMarkType (text, rule, ...) occur at runtime
  const t = getMarkType(mark) as string | undefined;
  if (t === 'text') return 0;
  if (t === 'rule') return 1;
  return 2;
}

function coerceData(olliSpec: UnitOlliVisSpec): void {
  if (!olliSpec.fields) return;
  const fieldSpecs = olliSpec.fields.map((f) => ({ name: f.field, type: f.type }));
  olliSpec.data = typeCoerceData(olliSpec.data, fieldSpecs) as OlliDataset;
}

function adaptUnitSpec(spec: any, data: OlliDataset): UnitOlliVisSpec {
  const olliSpec: UnitOlliVisSpec = {
    description: spec.description,
    data,
    fields: [],
    axes: [],
    legends: [],
    guides: [],
  };

  const getMark = (spec: any): OlliMark | undefined => {
    const mark = spec.mark;
    const raw = mark && mark.type ? mark.type : mark;
    let olliMark: OlliMark | undefined;
    switch (raw) {
      case 'circle':
      case 'square':
        olliMark = 'point';
        break;
      case 'trail':
        olliMark = 'line';
        break;
      default:
        olliMark = raw;
    }
    if (olliMark === 'arc' && mark && typeof mark === 'object' && mark.innerRadius) {
      olliMark = { type: 'arc', innerRadius: mark.innerRadius };
    }
    return olliMark;
  };
  const mark = getMark(spec);
  if (mark !== undefined) olliSpec.mark = mark;

  if (spec.encoding) {
    for (const [channel, encoding] of Object.entries(spec.encoding) as [string, any][]) {
      const fieldDef: any = { ...encoding };
      fieldDef.field = getFieldFromEncoding(encoding, data);
      fieldDef.label = getLabelFromEncoding(encoding);
      fieldDef.type =
        encoding.type ||
        (encoding.timeUnit ? 'temporal' : false) ||
        (encoding.bin ? 'quantitative' : false) ||
        typeInference(data, fieldDef.field);

      if (!fieldDef.field) {
        continue;
      }
      if (['row', 'column', 'facet'].includes(channel)) {
        olliSpec.facet = fieldDef.field;
      } else if (getMarkType(olliSpec.mark) === 'line' && ['color', 'stroke', 'detail'].includes(channel)) {
        olliSpec.facet = fieldDef.field;
      } else if (['x', 'y'].includes(channel)) {
        const isStackedCumulativeAxis = encoding.aggregate
          && encoding.stack !== null && encoding.stack !== false
          && ['area', 'bar'].includes(getMarkType(mark) ?? '')
          && spec.encoding && hasStackingColorOrDetail(spec.encoding);
        const tickConfig: GuideTicksConfig = {
          field: fieldDef.field,
          type: fieldDef.type,
          bin: !!encoding.bin,
          timeUnit: encoding.timeUnit,
          scaleZero: encoding.scale?.zero,
          scaleDomain: asArrayDomain(encoding.scale?.domain),
          axisSize: channel === 'x'
            ? (typeof spec.width === 'number' ? spec.width : undefined)
            : (typeof spec.height === 'number' ? spec.height : undefined),
          tickCount: encoding.axis?.tickCount,
          tickValues: encoding.axis?.values,
          // vega-lite sorts discrete scales ascending unless told otherwise
          sort: encoding.sort === undefined ? 'ascending' : encoding.sort,
        };
        const axisTicks = (isStackedCumulativeAxis && encoding.axis !== null) ? [] : computeGuideTicks(data, tickConfig);
        const axis: OlliAxis = {
          axisType: channel as 'x' | 'y',
          field: fieldDef.field,
          title: encoding.title || encoding.axis?.title || undefined,
        };
        if (axisTicks) axis.ticks = axisTicks;
        olliSpec.axes!.push(axis);
      } else if (['color', 'fill', 'stroke', 'opacity', 'size'].includes(channel)) {
        // fill/stroke are color variants in vega-lite
        const legend: OlliLegend = {
          channel: (['fill', 'stroke'].includes(channel) ? 'color' : channel) as 'color' | 'opacity' | 'size',
          field: fieldDef.field,
          title: encoding.title || encoding.legend?.title || undefined,
        };
        if (fieldDef.type === 'quantitative' || fieldDef.type === 'temporal') {
          const ticks = computeGuideTicks(data, {
            field: fieldDef.field,
            type: fieldDef.type,
            bin: !!encoding.bin,
            timeUnit: encoding.timeUnit,
            scaleZero: encoding.scale?.zero ?? false,
            scaleDomain: asArrayDomain(encoding.scale?.domain),
            tickCount: encoding.legend?.tickCount,
            tickValues: encoding.legend?.values,
          });
          if (ticks) legend.ticks = ticks;
        }
        olliSpec.legends!.push(legend);
      } else if (['order', 'theta'].includes(channel)) {
        olliSpec.guides!.push({
          field: fieldDef.field,
          title: encoding.title,
          channel,
        });
      }

      if (!olliSpec.fields!.find((f) => f.field === fieldDef.field)) {
        olliSpec.fields!.push(fieldDef);
      }
    }
  }

  const mt = getMarkType(mark);
  if (mt && ['bar', 'area'].includes(mt) && spec.encoding) {
    const hasColorOrDetail = hasStackingColorOrDetail(spec.encoding);
    const hasOffset = 'xOffset' in spec.encoding || 'yOffset' in spec.encoding;
    let stack: 'stacked' | 'grouped' | undefined;
    if (mt === 'bar' && hasOffset) {
      stack = 'grouped';
    } else if (hasColorOrDetail) {
      const quantChannel = (['x', 'y'] as const).find((ch) => {
        const enc = spec.encoding?.[ch];
        return enc && (enc.aggregate || enc.type === 'quantitative');
      });
      const quantEnc = quantChannel ? spec.encoding[quantChannel] : undefined;
      const stackDisabled = quantEnc?.stack === false || quantEnc?.stack === null;
      if (!stackDisabled) {
        stack = 'stacked';
      }
    }
    if (stack) {
      olliSpec.mark = typeof olliSpec.mark === 'object'
        ? { ...olliSpec.mark, stack }
        : { type: mt, stack };
    }
  }

  coerceData(olliSpec);

  // geographic point charts (longitude/latitude channels) often carry
  // recognizable place columns that aren't encoded; surface them so tables
  // and filtering are informative, and derive the census region from the
  // state so the structure can group region -> state like choropleths do
  if (spec.encoding?.longitude && spec.encoding?.latitude && olliSpec.data.length > 0) {
    const hasState = olliSpec.data.some((d) => d['state'] != null);
    if (hasState && !olliSpec.data.some((d) => d['region'] != null)) {
      olliSpec.data = olliSpec.data.map((d) => {
        if (d['state'] == null) return d;
        const region = regionForUSState(String(d['state']));
        return region ? { ...d, region } : d;
      }) as OlliDataset;
    }
    for (const geoField of ['city', 'state', 'county', 'region']) {
      if (olliSpec.data.some((d) => d[geoField] != null) && !olliSpec.fields!.find((f) => f.field === geoField)) {
        olliSpec.fields!.push({ field: geoField, type: 'nominal' });
      }
    }
    if (olliSpec.data.some((d) => d['region'] != null) && !olliSpec.guides!.some((g) => g.field === 'region')) {
      olliSpec.guides!.push({ field: 'region', title: 'Geography' });
    }
  }

  if (getMarkType(olliSpec.mark) === 'geoshape' && olliSpec.data.length > 0) {
    const idField = olliSpec.data[0]!['id'] != null ? 'id' : undefined;
    if (idField && looksLikeFips(olliSpec.data, idField)) {
      olliSpec.data = enrichWithUSGeo(olliSpec.data, idField) as OlliDataset;
      const geoFields: Array<{ field: string; type: 'nominal' }> = [];
      if (olliSpec.data.some((d) => d['county'] != null)) {
        geoFields.push({ field: 'county', type: 'nominal' });
      }
      if (olliSpec.data.some((d) => d['state'] != null)) {
        geoFields.push({ field: 'state', type: 'nominal' });
      }
      if (olliSpec.data.some((d) => d['region'] != null)) {
        geoFields.push({ field: 'region', type: 'nominal' });
      }
      for (const gf of geoFields) {
        if (!olliSpec.fields!.find((f) => f.field === gf.field)) {
          olliSpec.fields!.push(gf);
        }
      }
      if (geoFields.some((f) => f.field === 'region')) {
        if (!olliSpec.guides) olliSpec.guides = [];
        olliSpec.guides.push({ field: 'region', title: 'Geography' });
      }
    }
  }

  return olliSpec;
}

const COMPOSITE_OPS = ['layer', 'concat', 'hconcat', 'vconcat'];

function getCompositeOp(spec: any): string | undefined {
  return COMPOSITE_OPS.find((op) => op in spec);
}

interface LeafView {
  view: any;
  encoding: any;
  data: any;
  // composition path matching compiled Vega mark names, e.g. "concat_0_layer_1"
  path: string;
}

// Composite views can nest (vconcat of hconcats, layer of layers, ...);
// MultiOlliVisSpec is flat, so collect the leaf mark views, merging encoding
// and data downward (child overrides parent).
function flattenCompositeViews(spec: any, vlOp: string): { leaves: LeafView[]; allLayer: boolean } {
  const leaves: LeafView[] = [];
  let allLayer = vlOp === 'layer';

  const walk = (view: any, inheritedEncoding: any, inheritedData: any, path: string) => {
    const encoding = { ...inheritedEncoding, ...(view.encoding || {}) };
    const data = view.data || inheritedData;
    const op = getCompositeOp(view);
    if ('mark' in view) {
      leaves.push({ view, encoding, data, path });
    } else if (op) {
      if (op !== 'layer') allLayer = false;
      view[op].forEach((child: any, i: number) => {
        walk(child, encoding, data, `${path}_${op === 'layer' ? 'layer' : 'concat'}_${i}`);
      });
    }
  };

  spec[vlOp].forEach((child: any, i: number) => {
    walk(child, spec.encoding || {}, spec.data, `${vlOp === 'layer' ? 'layer' : 'concat'}_${i}`);
  });
  return { leaves, allLayer };
}

function adaptMultiSpec(
  spec: any,
  vlOp: string,
  data: OlliDataset[],
  resolveLeafDataset?: LeafDatasetResolver,
): OlliVisSpec {
  const units: UnitOlliVisSpec[] = [];
  const unitScopes = new Map<UnitOlliVisSpec, string>();

  // the portion of a leaf path outside any layer composition: leaves in the
  // same layer group overlay in one plot, leaves in different concat children
  // are separate charts
  const layerScope = (path: string): string => {
    const idx = path.search(/(^|_)layer_\d+/);
    if (idx === -1) return path;
    return path.slice(0, idx);
  };

  // One unit per distinct dataset. Within a layer group, a view merges into
  // an existing unit when its dataset's columns are a subset/superset of the
  // unit's, or when the unit's contributed fields all exist in the view's
  // dataset (a filtered/derived overlay of the same data, e.g. a highlight
  // layer). The unit keeps the dataset with the most rows — derived
  // annotation data is filtered/aggregated down.
  const unitFor = (dataset: OlliDataset, scope: string): UnitOlliVisSpec => {
    const existing = units.find((u) => {
      if (u.data === dataset) return true;
      if (unitScopes.get(u) !== scope) return false;
      const a = Object.keys(u.data[0] ?? {});
      const b = Object.keys(dataset[0] ?? {});
      if (b.every((k) => a.includes(k)) || a.every((k) => b.includes(k))) return true;
      const uFields = (u.fields ?? []).map((f) => f.field);
      return uFields.length > 0 && uFields.every((f) => b.includes(f));
    });
    if (existing) {
      const existingCols = Object.keys(existing.data[0] ?? {});
      const newCols = Object.keys(dataset[0] ?? {});
      const coversExisting = existingCols.every((k) => newCols.includes(k));
      const moreRows = dataset.length > existing.data.length;
      const sameRows = dataset.length === existing.data.length;
      if (coversExisting && (moreRows || (sameRows && newCols.length > existingCols.length))) {
        existing.data = dataset;
      }
      return existing;
    }
    const unit: UnitOlliVisSpec = {
      description: spec.description,
      data: dataset,
      fields: [],
      axes: [],
      legends: [],
      guides: [],
    };
    units.push(unit);
    unitScopes.set(unit, scope);
    return unit;
  };

  // one axis per channel per layer group, contributed by the
  // highest-precedence mark (the rendered chart has a single shared scale) —
  // unless the spec resolves that channel's scale independently (dual axis)
  const independentChannels = new Set(
    Object.entries(spec.resolve?.scale ?? {})
      .filter(([, v]) => v === 'independent')
      .map(([k]) => k),
  );
  interface AxisContribution {
    prec: number;
    scope: string;
    axis: OlliAxis;
    // the view's x2/y2 field: a ranged mark's end-of-range (e.g. waterfall's
    // running total). A later view positioning directly on that field reveals
    // it as the scale's reading field, so it takes over the axis.
    rangeEnd: string | undefined;
  }
  const axisMeta = new Map<UnitOlliVisSpec, Partial<Record<'x' | 'y', AxisContribution>>>();
  const mergeAxes = (
    unit: UnitOlliVisSpec,
    axes: OlliAxis[],
    prec: number,
    scope: string,
    rangeEnds: Partial<Record<'x' | 'y', string>>,
  ) => {
    const meta = axisMeta.get(unit) ?? {};
    axisMeta.set(unit, meta);
    for (const axis of axes) {
      if (independentChannels.has(axis.axisType)) {
        unit.axes!.push(axis);
        continue;
      }
      const cur = meta[axis.axisType];
      if (cur && cur.scope === scope) {
        const curIsBinned = unit.fields?.some((f) => f.field === cur.axis.field && f.bin);
        const matchesRangeEnd = !curIsBinned && axis.field !== cur.axis.field && axis.field === cur.rangeEnd;
        if (prec > cur.prec || matchesRangeEnd) {
          const replacement: OlliAxis = { ...axis };
          if (replacement.title === undefined && cur.axis.title !== undefined) {
            replacement.title = cur.axis.title;
          }
          unit.axes = unit.axes!.filter((a) => a !== cur.axis);
          unit.axes.push(replacement);
          meta[axis.axisType] = {
            prec: Math.max(prec, cur.prec),
            scope,
            axis: replacement,
            rangeEnd: rangeEnds[axis.axisType] ?? cur.rangeEnd,
          };
        }
      } else {
        unit.axes!.push(axis);
        if (!cur) meta[axis.axisType] = { prec, scope, axis, rangeEnd: rangeEnds[axis.axisType] };
      }
    }
  };

  const { leaves, allLayer } = flattenCompositeViews(spec, vlOp);
  for (const { view, encoding, data: viewData, path } of leaves) {
    const viewSpec = {
      data: viewData,
      mark: view.mark,
      encoding,
    };
    if (!Object.keys(encoding).length) continue;

    const resolved = resolveLeafDataset?.(path);
    let dataset = resolved?.dataset;
    // datum-/value-only views (annotation rules, labels) carry no field
    // encodings; skip them rather than emit field-less units
    const hasFields = (d: OlliDataset) =>
      Object.values(encoding).some((f: any) => getFieldFromEncoding(f, d ?? []));
    if (dataset && !hasFields(dataset)) continue;
    if (!dataset) {
      dataset = data.find((d) => {
        if (!d?.length) return false;
        const fields = Object.keys(d[0]!);
        const viewFields = Object.values(encoding)
          .map((f: any) => getFieldFromEncoding(f, d))
          .filter((f): f is string => !!f);
        return viewFields.length > 0 && viewFields.every((f) => fields.includes(f));
      });
    }
    if (!dataset) continue;

    const scope = layerScope(path);
    const viewOlliSpec = adaptUnitSpec(viewSpec, dataset);
    const viewPrec = markPrecedence(viewOlliSpec.mark);
    const unitSpec = unitFor(dataset, scope);
    // a view merged into a unit keeping different data (a derived overlay)
    // can only contribute fields that exist in the kept dataset
    let vFields = viewOlliSpec.fields ?? [];
    let vAxes = viewOlliSpec.axes ?? [];
    let vLegends = viewOlliSpec.legends ?? [];
    let vGuides = viewOlliSpec.guides ?? [];
    if (unitSpec.data !== dataset) {
      const cols = Object.keys(unitSpec.data[0] ?? {});
      // fields may use vega-lite path syntax (markers[0], a.b); match the root
      const hasCol = (f: string) => cols.includes(f) || cols.includes(f.split(/[.[]/)[0]!);
      vFields = vFields.filter((f) => hasCol(f.field));
      vAxes = vAxes.filter((a) => hasCol(a.field));
      vLegends = vLegends.filter((l) => hasCol(l.field));
      vGuides = vGuides.filter((g) => hasCol(g.field));
    }
    const rangeEnds: Partial<Record<'x' | 'y', string>> = {};
    for (const ch of ['x', 'y'] as const) {
      const end = encoding[`${ch}2`] ? getFieldFromEncoding(encoding[`${ch}2`], dataset) : undefined;
      if (end) rangeEnds[ch] = end;
    }
    unitSpec.fields!.push(...vFields);
    mergeAxes(unitSpec, vAxes, viewPrec, scope, rangeEnds);
    unitSpec.legends!.push(...vLegends);
    unitSpec.guides!.push(...vGuides);
    // ties keep the first view's mark: later same-precedence layers are
    // overlays (e.g. an invisible highlight circle over a line), not the
    // chart's primary mark
    if (viewOlliSpec.mark !== undefined
      && (unitSpec.mark === undefined || viewPrec > markPrecedence(unitSpec.mark))) {
      unitSpec.mark = viewOlliSpec.mark;
    }

    // a view merged into a unit with different (fuller) data is a derived
    // overlay; if it was filtered, surface the filter as a data highlight
    if (unitSpec.data !== dataset && resolved?.dataEntry?.transform) {
      for (const t of resolved.dataEntry.transform) {
        if (t?.type !== 'filter' || typeof t.expr !== 'string') continue;
        for (const predicate of filterExprToPredicates(t.expr)) {
          if (!(predicate.field in (unitSpec.data[0] ?? {}))) continue;
          const annotations = (unitSpec.annotations ??= []);
          if (!annotations.some((a) => JSON.stringify(a.predicate) === JSON.stringify(predicate))) {
            annotations.push({ predicate: predicate as any });
          }
        }
      }
    }
  }

  for (const s of units) {
    s.fields = s.fields!.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);
    s.axes = s.axes!.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);
    s.legends = s.legends!.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);
    s.guides = s.guides!.filter((g, i, self) => self.findIndex((g2) => g2.field === g.field) === i);
    coerceData(s);
  }

  if (units.length === 1) {
    return units[0]!;
  }

  return {
    operator: allLayer ? 'layer' : 'concat',
    units,
  };
}
