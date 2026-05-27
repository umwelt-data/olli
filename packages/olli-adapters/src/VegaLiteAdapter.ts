import type { UnitOlliVisSpec, OlliVisSpec, OlliDataset, OlliAxis, OlliLegend, OlliMark } from 'olli-vis';
import { getMarkType } from 'olli-vis/spec/types';
import { typeInference } from 'olli-vis/util/types';
import { typeCoerceData } from '@umwelt-data/umwelt-utils/data';
import { describeField } from '@umwelt-data/umwelt-utils/description';
import { evaluateVegaData, extractOutputDatasets } from './vegaDataEval.js';
import { computeGuideTicks } from '@umwelt-data/umwelt-utils/vega';
import type { GuideTicksConfig } from '@umwelt-data/umwelt-utils/vega';
import type { VisAdapter } from './types.js';
import { inferFormatFromUrl, parseDelimited } from './utils.js';
import { enrichWithUSGeo, looksLikeFips } from './geo/enrichGeoData.js';
import { compile } from 'vega-lite';

function getDatasets(vegaSpec: any): OlliDataset[] {
  const store = evaluateVegaData(vegaSpec.data);
  const leafNames = findLeafDatasets(vegaSpec.data);
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
  return extractOutputDatasets(vegaSpec.data, store) as OlliDataset[];
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

export function VegaLiteAdapterSync(spec: any): OlliVisSpec {
  const vegaSpec = compile(spec).spec;
  const data = getDatasets(vegaSpec);

  if ('repeat' in spec && 'spec' in spec) {
    return adaptRepeatSpec(spec, data);
  }

  if ('facet' in spec && 'spec' in spec && !('mark' in spec)) {
    return adaptFacetSpec(spec, data);
  }

  if ('mark' in spec) {
    const normalized = normalizeOverlayMark(spec);
    return adaptUnitSpec(normalized, data[0]!);
  }

  if ('layer' in spec || 'concat' in spec || 'hconcat' in spec || 'vconcat' in spec) {
    const vlOp = Object.keys(spec).find((k) => ['layer', 'concat', 'hconcat', 'vconcat'].includes(k))!;
    return adaptMultiSpec(spec, vlOp, data);
  }

  return adaptUnitSpec(spec, data[0]!);
}

async function fetchAndParse(url: string, format?: any): Promise<any> {
  const response = await fetch(url);
  const text = await response.text();
  const fmt = format?.type || inferFormatFromUrl(url);

  if (fmt === 'topojson' || fmt === 'json') {
    return JSON.parse(text);
  }
  return parseDelimited(text, fmt);
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

function adaptRepeatSpec(spec: any, data: OlliDataset[]): OlliVisSpec {
  const repeatDef = spec.repeat;
  const repeatValues: string[] = Array.isArray(repeatDef)
    ? repeatDef
    : [...(repeatDef.row || []), ...(repeatDef.column || []), ...(repeatDef.layer || [])];

  const units: UnitOlliVisSpec[] = [];
  const usedDatasets = new Set<number>();
  const isLayerRepeat = !Array.isArray(repeatDef) && repeatDef.layer;

  for (const value of repeatValues) {
    const inner = JSON.parse(JSON.stringify(spec.spec));
    resolveRepeatRefs(inner, value);
    const innerSpec = normalizeOverlayMark(inner);

    if ('mark' in innerSpec) {
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
      } else if (getMarkType(olliSpec.mark) === 'line' && ['color', 'detail'].includes(channel)) {
        olliSpec.facet = fieldDef.field;
      } else if (['x', 'y'].includes(channel)) {
        const isStackedCumulativeAxis = encoding.aggregate
          && encoding.stack !== null && encoding.stack !== false
          && ['area', 'bar'].includes(getMarkType(mark) ?? '')
          && spec.encoding && ('color' in spec.encoding || 'detail' in spec.encoding);
        const tickConfig: GuideTicksConfig = {
          field: fieldDef.field,
          type: fieldDef.type,
          bin: !!encoding.bin,
          timeUnit: encoding.timeUnit,
          scaleZero: encoding.scale?.zero,
          scaleDomain: encoding.scale?.domain,
          axisSize: channel === 'x'
            ? (typeof spec.width === 'number' ? spec.width : undefined)
            : (typeof spec.height === 'number' ? spec.height : undefined),
          tickCount: encoding.axis?.tickCount,
          tickValues: encoding.axis?.values,
        };
        const axisTicks = (isStackedCumulativeAxis && encoding.axis !== null) ? [] : computeGuideTicks(data, tickConfig);
        const axis: OlliAxis = {
          axisType: channel as 'x' | 'y',
          field: fieldDef.field,
          title: encoding.title,
        };
        if (axisTicks) axis.ticks = axisTicks;
        olliSpec.axes!.push(axis);
      } else if (['color', 'opacity', 'size'].includes(channel)) {
        const legend: OlliLegend = {
          channel: channel as 'color' | 'opacity' | 'size',
          field: fieldDef.field,
          title: encoding.title,
        };
        if (fieldDef.type === 'quantitative' || fieldDef.type === 'temporal') {
          const ticks = computeGuideTicks(data, {
            field: fieldDef.field,
            type: fieldDef.type,
            bin: !!encoding.bin,
            timeUnit: encoding.timeUnit,
            scaleZero: encoding.scale?.zero ?? false,
            scaleDomain: encoding.scale?.domain,
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
    const hasColorOrDetail = 'color' in spec.encoding || 'detail' in spec.encoding;
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

  if (getMarkType(olliSpec.mark) === 'geoshape' && olliSpec.data.length > 0) {
    const idField = olliSpec.data[0]!['id'] != null ? 'id' : undefined;
    if (idField && looksLikeFips(olliSpec.data, idField)) {
      olliSpec.data = enrichWithUSGeo(olliSpec.data, idField);
      const geoFields: Array<{ field: string; type: 'nominal' }> = [];
      if (olliSpec.data.some((d) => d['county_name'] != null)) {
        geoFields.push({ field: 'county_name', type: 'nominal' });
      }
      if (olliSpec.data.some((d) => d['state_name'] != null)) {
        geoFields.push({ field: 'state_name', type: 'nominal' });
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

function adaptMultiSpec(
  spec: any,
  vlOp: string,
  data: OlliDataset[],
): OlliVisSpec {
  const units: UnitOlliVisSpec[] = data.map((d) => ({
    description: spec.description,
    data: d,
    fields: [],
    axes: [],
    legends: [],
  }));

  for (const view of spec[vlOp]) {
    if ('mark' in view) {
      const mergedEncoding = { ...(spec.encoding || {}), ...(view.encoding || {}) };
      const viewSpec = {
        data: view.data || spec.data,
        mark: view.mark,
        encoding: mergedEncoding,
      };
      if (!Object.keys(mergedEncoding).length) continue;
      const dataset = data.find((d) => {
        if (!d?.length) return false;
        const fields = Object.keys(d[0]!);
        const viewFields = Object.values(viewSpec.encoding)
          .map((f: any) => getFieldFromEncoding(f, d))
          .filter((f): f is string => !!f);
        return viewFields.length > 0 && viewFields.every((f) => fields.includes(f));
      });
      if (!dataset) continue;
      const viewOlliSpec = adaptUnitSpec(viewSpec, dataset);
      const unitSpec = units.find((s) => s.data?.length > 0 && Object.keys(s.data[0]!).every((k) => k in dataset[0]!));
      if (unitSpec) {
        unitSpec.fields!.push(...(viewOlliSpec.fields ?? []));
        unitSpec.axes!.push(...(viewOlliSpec.axes ?? []));
        unitSpec.legends!.push(...(viewOlliSpec.legends ?? []));
        if (viewOlliSpec.mark !== undefined) unitSpec.mark = viewOlliSpec.mark;
      }
    }
  }

  for (const s of units) {
    s.fields = s.fields!.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);
    s.axes = s.axes!.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);
    s.legends = s.legends!.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);
    coerceData(s);
  }

  if (units.length === 1) {
    return units[0]!;
  }

  return {
    operator: vlOp === 'layer' ? 'layer' : 'concat',
    units,
  };
}
