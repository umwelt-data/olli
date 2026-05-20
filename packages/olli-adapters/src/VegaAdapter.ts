import type { UnitOlliVisSpec, OlliDataset, OlliAxis, OlliLegend, OlliMark } from 'olli-vis';
import { filterUniqueObjects, inferFormatFromUrl, parseCsv } from './utils.js';
import { evaluateVegaData } from './vegaDataEval.js';
import { computeAxisTicks } from '@umwelt-data/umwelt-utils/vega';
import type { AxisTicksConfig } from '@umwelt-data/umwelt-utils/vega';
import type { VisAdapter } from './types.js';

export function VegaAdapterSync(spec: any): UnitOlliVisSpec {
  const { data, dataName } = getDatasets(spec);
  const description: string | undefined = spec.description;

  const facetMark = spec.marks?.find((m: any) => m.from?.facet);
  const isFaceted = !!facetMark;

  const axes = collectAxes(spec, data);
  const legends = collectLegends(spec, data);
  const mark = getMarkType(spec, dataName);
  const title = getChartTitle(spec);

  const result: UnitOlliVisSpec = {
    data,
    axes: filterUniqueObjects(axes),
    legends: filterUniqueObjects(legends),
  };

  if (isFaceted) {
    const facetDef = facetMark.from.facet.groupby;
    result.facet = Array.isArray(facetDef) ? facetDef[0] : facetDef;
  }

  if (mark !== undefined) result.mark = mark;
  if (title !== undefined) result.title = title;
  if (description !== undefined) result.description = description;

  return result;
}

export const VegaAdapter: VisAdapter<any> = async (spec: any): Promise<UnitOlliVisSpec> => {
  const resolved = await resolveVegaData(spec);
  return VegaAdapterSync(resolved);
};

function getDatasets(spec: any): { data: OlliDataset; dataName?: string } {
  if (!spec.data || !Array.isArray(spec.data) || spec.data.length === 0) return { data: [] };
  const store = evaluateVegaData(spec.data);

  const scaleDataNames = new Set<string>();
  for (const scale of spec.scales || []) {
    if (scale.domain?.data) scaleDataNames.add(scale.domain.data);
  }

  const markDataNames = new Set<string>();
  collectMarkDataRefs(spec.marks, markDataNames);

  // Prefer datasets referenced by both scales and marks (the primary chart data)
  for (const name of scaleDataNames) {
    if (markDataNames.has(name)) {
      const dataset = store[name];
      if (dataset && dataset.length > 0 && dataset[0] && Object.keys(dataset[0]).length > 0) {
        return { data: dataset as OlliDataset, dataName: name };
      }
    }
  }

  for (const name of markDataNames) {
    const dataset = store[name];
    if (dataset && dataset.length > 0 && dataset[0] && Object.keys(dataset[0]).length > 0) {
      return { data: dataset as OlliDataset, dataName: name };
    }
  }

  for (const entry of [...spec.data].reverse()) {
    const dataset = store[entry.name];
    if (dataset && dataset.length > 0 && dataset[0] && Object.keys(dataset[0]).length > 0) {
      return { data: dataset as OlliDataset, dataName: entry.name };
    }
  }

  return { data: [] };
}

function collectMarkDataRefs(marks: any[] | undefined, refs: Set<string>): void {
  if (!marks) return;
  for (const mark of marks) {
    if (mark.from?.data) refs.add(mark.from.data);
    if (mark.from?.facet?.data) refs.add(mark.from.facet.data);
    if (mark.marks) collectMarkDataRefs(mark.marks, refs);
  }
}

function collectAxes(spec: any, data: OlliDataset): OlliAxis[] {
  const axes: OlliAxis[] = [];

  for (const axisSpec of spec.axes || []) {
    const axis = parseAxisFromSpec(axisSpec, spec, data);
    if (axis) axes.push(axis);
  }

  for (const mark of spec.marks || []) {
    if (mark.type === 'group' && mark.axes) {
      for (const axisSpec of mark.axes) {
        const axis = parseAxisFromSpec(axisSpec, spec, data, mark);
        if (axis) axes.push(axis);
      }
    }
  }

  return axes;
}

function parseAxisFromSpec(axisSpec: any, spec: any, data: OlliDataset, groupMark?: any): OlliAxis | undefined {
  const scaleName = axisSpec.scale;
  const scaleSpec = findScaleSpec(spec, scaleName, groupMark);
  if (!scaleSpec) return undefined;

  const field = extractFieldFromScale(scaleSpec);
  if (!field) return undefined;

  const scaleType = scaleSpec.type;
  const axisType: 'x' | 'y' = axisSpec.orient === 'bottom' || axisSpec.orient === 'top' ? 'x' : 'y';
  const title: string | undefined = axisSpec.title;

  if (scaleType === 'time' || scaleType === 'utc') {
    for (const datum of data) {
      if (datum[field] != null) datum[field] = new Date(datum[field] as string | number);
    }
  }

  const tickConfig: AxisTicksConfig = {
    field,
    type: scaleTypeToFieldType(scaleType),
    scaleZero: scaleSpec.zero,
    scaleDomain: scaleSpec.domain && Array.isArray(scaleSpec.domain) ? scaleSpec.domain : undefined,
    axisSize: axisType === 'x'
      ? (typeof spec.width === 'number' ? spec.width : undefined)
      : (typeof spec.height === 'number' ? spec.height : undefined),
    tickCount: axisSpec.tickCount,
    tickValues: axisSpec.values,
  };

  const computed = computeAxisTicks(data, { [axisType]: tickConfig });
  const ticks = computed[axisType];

  const axis: OlliAxis = { axisType, field, scaleType };
  if (title !== undefined) axis.title = title;
  if (ticks) axis.ticks = ticks;
  return axis;
}

function findScaleSpec(spec: any, scaleName: string, groupMark?: any): any {
  if (groupMark?.scales) {
    const nested = groupMark.scales.find((s: any) => s.name === scaleName);
    if (nested) return nested;
  }

  const topLevel = spec.scales?.find((s: any) => s.name === scaleName);
  if (topLevel) return topLevel;

  for (const mark of spec.marks || []) {
    if (mark.type === 'group' && mark.scales) {
      const nested = mark.scales.find((s: any) => s.name === scaleName);
      if (nested) return nested;
    }
  }

  return undefined;
}

function extractFieldFromScale(scaleSpec: any): string | undefined {
  const scaleDomain = scaleSpec?.domain;
  if (!scaleDomain) return undefined;

  if (scaleDomain.field && !scaleDomain.field?.signal) {
    return scaleDomain.field;
  }

  if (scaleDomain.fields) {
    if (
      scaleDomain.fields.length === 2 &&
      typeof scaleDomain.fields[0] === 'string' &&
      (scaleDomain.fields[0] as string).endsWith('_start') &&
      (scaleDomain.fields[1] as string).endsWith('_end')
    ) {
      const str = scaleDomain.fields[0] as string;
      return str.substring(0, str.indexOf('_start'));
    }
    const first = scaleDomain.fields[0];
    if (typeof first === 'string') return first;
    if (first?.field) return first.field;
  }

  return undefined;
}

function scaleTypeToFieldType(scaleType?: string): 'quantitative' | 'ordinal' | 'nominal' | 'temporal' {
  switch (scaleType) {
    case 'time':
    case 'utc':
      return 'temporal';
    case 'ordinal':
    case 'band':
    case 'point':
      return 'nominal';
    default:
      return 'quantitative';
  }
}

function collectLegends(spec: any, data: OlliDataset): OlliLegend[] {
  const legends: OlliLegend[] = [];
  for (const legendSpec of spec.legends || []) {
    const legend = parseLegendFromSpec(legendSpec, spec, data);
    if (legend) legends.push(legend);
  }
  return legends;
}

function parseLegendFromSpec(legendSpec: any, spec: any, data: OlliDataset): OlliLegend | undefined {
  const channelKeys = ['fill', 'stroke', 'opacity', 'size', 'shape', 'strokeDash', 'strokeWidth'];
  let channel: string | undefined;
  let scaleName: string | undefined;

  for (const key of channelKeys) {
    if (legendSpec[key]) {
      scaleName = legendSpec[key];
      channel = mapVegaLegendChannel(key);
      break;
    }
  }

  if (!scaleName || !channel) return undefined;

  const scaleSpec = findScaleSpec(spec, scaleName);
  const title: string | undefined = legendSpec.title;

  let field: string | undefined;
  if (scaleSpec?.domain?.field && !scaleSpec.domain.field?.signal) {
    field = scaleSpec.domain.field;
  } else if (title && data.length > 0) {
    if (Object.keys(data[0]!).some((key) => key.toLocaleLowerCase() === title.toLocaleLowerCase())) {
      field = title.toLocaleLowerCase();
    }
  }

  return {
    channel: channel as 'color' | 'opacity' | 'size',
    title: title ?? '',
    field: field as string,
  };
}

function mapVegaLegendChannel(vegaChannel: string): string {
  switch (vegaChannel) {
    case 'fill':
    case 'stroke':
      return 'color';
    default:
      return vegaChannel;
  }
}

function getChartTitle(spec: any): string | undefined {
  if (!spec.title) return undefined;
  if (typeof spec.title === 'string') return spec.title;
  if (spec.title.text && typeof spec.title.text === 'string') return spec.title.text;
  return undefined;
}

function getMarkType(spec: any, primaryDataName?: string): OlliMark | undefined {
  const facetMark = spec.marks?.find((m: any) => m.from?.facet);
  if (facetMark?.marks) {
    return vegaMarkToOlliMark(facetMark.marks[0]?.type);
  }
  if (primaryDataName) {
    const primaryMark = spec.marks?.find(
      (m: any) => m.type !== 'group' && m.type !== 'text' && m.from?.data === primaryDataName,
    );
    if (primaryMark) return vegaMarkToOlliMark(primaryMark.type);
  }
  const dataMark = spec.marks?.find((m: any) => m.type !== 'group' && m.type !== 'text');
  return vegaMarkToOlliMark(dataMark?.type);
}

function vegaMarkToOlliMark(mark?: string): OlliMark | undefined {
  switch (mark) {
    case 'symbol':
      return 'point';
    case 'line':
      return 'line';
    case 'rect':
      return 'bar';
    default:
      return undefined;
  }
}

async function resolveVegaData(spec: any): Promise<any> {
  if (!spec.data || !Array.isArray(spec.data)) return spec;

  const hasUrls = spec.data.some((d: any) => d.url);
  if (!hasUrls) return spec;

  const resolvedData = await Promise.all(
    spec.data.map(async (entry: any) => {
      if (!entry.url) return entry;
      const response = await fetch(entry.url);
      const text = await response.text();
      const format = entry.format?.type || inferFormatFromUrl(entry.url);
      const values = format === 'json' ? JSON.parse(text) : parseCsv(text);
      return { ...entry, values, url: undefined };
    }),
  );

  return { ...spec, data: resolvedData };
}
