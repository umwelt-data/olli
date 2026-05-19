import type { UnitOlliVisSpec, OlliVisSpec, OlliDataset, OlliAxis, OlliMark } from 'olli-vis';
import { typeInference } from 'olli-vis';
import { typeCoerceData } from '@umwelt-data/umwelt-utils/data';
import { getData, getVegaScene, getVegaView } from './utils.js';
import { getVegaAxisTicks } from '@umwelt-data/umwelt-utils/vega';
import type { VisAdapter } from './types.js';

export const VegaLiteAdapter: VisAdapter<any> = async (spec: any): Promise<OlliVisSpec> => {
  const vegaLite = await import('vega-lite');
  const view = await getVegaView(vegaLite.compile(spec).spec);
  const scene = getVegaScene(view);
  const data = getData(scene);

  if ('repeat' in spec && 'spec' in spec) {
    return adaptRepeatSpec(scene, spec, data);
  }

  if ('facet' in spec && 'spec' in spec && !('mark' in spec)) {
    return adaptFacetSpec(scene, spec, data);
  }

  if ('mark' in spec) {
    const normalized = normalizeOverlayMark(spec);
    return adaptUnitSpec(scene, normalized, data[0]!);
  }

  if ('layer' in spec || 'concat' in spec || 'hconcat' in spec || 'vconcat' in spec) {
    const vlOp = Object.keys(spec).find((k) => ['layer', 'concat', 'hconcat', 'vconcat'].includes(k))!;
    return await adaptMultiSpec(scene, spec, vlOp, data);
  }

  return adaptUnitSpec(scene, spec, data[0]!);
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

async function adaptFacetSpec(scene: any, spec: any, data: OlliDataset[]): Promise<OlliVisSpec> {
  const { innerSpec, facetFields } = resolveInnerSpec(spec);

  if ('mark' in innerSpec) {
    const result = adaptUnitSpec(scene, normalizeOverlayMark(innerSpec), data[0]!);
    if (facetFields.length && !result.facet) result.facet = facetFields[0]!;
    return result;
  }

  if ('layer' in innerSpec) {
    return adaptMultiSpec(scene, innerSpec, 'layer', data);
  }

  return adaptUnitSpec(scene, innerSpec, data[0]!);
}

async function adaptRepeatSpec(scene: any, spec: any, data: OlliDataset[]): Promise<OlliVisSpec> {
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
      units.push(adaptUnitSpec(scene, innerSpec, dataset));
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
  if ('aggregate' in encoding) {
    if (encoding.aggregate === 'count') {
      return 'count';
    }
  }
  return `${encoding.bin ? 'binned ' : ''}${'aggregate' in encoding ? `${encoding.aggregate} ` : ''}${
    'condition' in encoding ? encoding.condition.field : encoding.field
  }${'timeUnit' in encoding && !(encoding.timeUnit === encoding.field.toLowerCase()) ? ` (${encoding.timeUnit})` : ''}`;
}

function coerceData(olliSpec: UnitOlliVisSpec): void {
  if (!olliSpec.fields) return;
  const fieldSpecs = olliSpec.fields.map((f) => ({ name: f.field, type: f.type }));
  olliSpec.data = typeCoerceData(olliSpec.data, fieldSpecs) as OlliDataset;
}

function adaptUnitSpec(scene: any, spec: any, data: OlliDataset): UnitOlliVisSpec {
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
    switch (raw) {
      case 'circle':
      case 'square':
        return 'point';
      case 'trail':
        return 'line';
      default:
        return raw;
    }
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
      } else if (olliSpec.mark === 'line' && ['color', 'detail'].includes(channel)) {
        olliSpec.facet = fieldDef.field;
      } else if (['x', 'y'].includes(channel)) {
        let axisTicks: any[] | undefined;
        try {
          const ticks = getVegaAxisTicks(scene);
          axisTicks = ticks?.[channel as 'x' | 'y'];
        } catch {}
        const axis: OlliAxis = {
          axisType: channel as 'x' | 'y',
          field: fieldDef.field,
          title: encoding.title,
        };
        if (axisTicks) axis.ticks = axisTicks;
        olliSpec.axes!.push(axis);
      } else if (['color', 'opacity', 'size'].includes(channel)) {
        olliSpec.legends!.push({
          channel: channel as 'color' | 'opacity' | 'size',
          field: fieldDef.field,
          title: encoding.title,
        });
      } else if (channel === 'order') {
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

  coerceData(olliSpec);

  return olliSpec;
}

async function adaptMultiSpec(
  scene: any,
  spec: any,
  vlOp: string,
  data: OlliDataset[],
): Promise<OlliVisSpec> {
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
      const viewOlliSpec = adaptUnitSpec(scene, viewSpec, dataset);
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
