import type { UnitOlliVisSpec, OlliDataset, OlliAxis, OlliLegend, OlliMark } from 'olli-vis';
import { filterUniqueObjects, findScenegraphNodes, getData, getVegaScene, getVegaView } from './utils.js';
import type { VisAdapter } from './types.js';

export const VegaAdapter: VisAdapter<any> = async (spec: any): Promise<UnitOlliVisSpec> => {
  const scene = getVegaScene(await getVegaView(spec));
  const data = getData(scene)[0]!;
  const description: string | undefined = spec.description;
  const base = scene.items.some((el: any) => el.role === 'scope')
    ? parseFacets(spec, scene, data)
    : parseSingleChart(spec, scene, data);
  if (description !== undefined) {
    base.description = description;
  }
  return base;
};

function parseFacets(spec: any, scene: any, data: OlliDataset): UnitOlliVisSpec {
  const axes = filterUniqueObjects<OlliAxis>(
    findScenegraphNodes(scene, 'axis').map((axisNode: any) => parseAxisInformation(spec, axisNode, data)),
  );
  const legends = filterUniqueObjects<OlliLegend>(
    findScenegraphNodes(scene, 'legend').map((legendNode: any) => parseLegendInformation(spec, legendNode, data)),
  );
  const facetMarkSpec = spec.marks?.find((m: any) => m.from && m.from.facet)!;

  const mark = vegaMarkToOlliMark(facetMarkSpec.marks[0].type);

  const facetDef = facetMarkSpec.from.facet.groupby;
  const facetField = Array.isArray(facetDef) ? facetDef[0] : facetDef;

  const result: UnitOlliVisSpec = {
    data,
    axes,
    legends,
    facet: facetField,
  };
  if (mark !== undefined) result.mark = mark;
  return result;
}

function parseSingleChart(spec: any, scene: any, data: OlliDataset): UnitOlliVisSpec {
  const axes = findScenegraphNodes(scene, 'axis').map((axisNode: any) => parseAxisInformation(spec, axisNode, data));
  const legends = findScenegraphNodes(scene, 'legend').map((legendNode: any) =>
    parseLegendInformation(spec, legendNode, data),
  );
  const chartTitle: string | undefined =
    findScenegraphNodes(scene, 'title').length > 0
      ? findScenegraphNodes(scene, 'title')[0].items[0].items[0].items[0].text
      : undefined;

  const mark = vegaMarkToOlliMark(spec.marks?.map((m: any) => m.type)[0]);

  const result: UnitOlliVisSpec = {
    data,
    axes,
    legends,
  };
  if (mark !== undefined) result.mark = mark;
  if (chartTitle !== undefined) result.title = chartTitle;
  return result;
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

function parseAxisInformation(spec: any, axis: any, data: OlliDataset): OlliAxis {
  const axisView = axis.items[0];
  const title: string = axisView.items.find((n: any) => n.role === 'axis-title')?.items?.[0]?.text;
  const scaleName: string = axisView.datum.scale;
  const scaleSpec = spec.scales?.find((specScale: any) => specScale.name === scaleName);

  let scaleDomain: any = scaleSpec?.domain;

  if (!scaleDomain) {
    spec.marks?.forEach((m: any) => {
      const markScales = m.scales;
      if (markScales) {
        const s = markScales.find((specScale: any) => specScale.name === scaleName);
        if (s) scaleDomain = s.domain;
      }
    });
  }

  let field: string;
  if (scaleDomain?.field && !scaleDomain?.field?.signal) {
    field = scaleDomain.field;
  } else if (scaleDomain.data && scaleDomain.fields) {
    if (
      scaleDomain.fields.length === 2 &&
      (scaleDomain.fields[0] as string).endsWith('_start') &&
      (scaleDomain.fields[1] as string).endsWith('_end')
    ) {
      const str = scaleDomain.fields[0] as string;
      field = str.substring(0, str.indexOf('_start'));
    } else {
      field = scaleDomain.fields[0];
    }
  } else {
    field = scaleDomain.fields[0].field;
  }

  const scaleType = scaleSpec?.type;
  const axisType: 'x' | 'y' = axisView.orient === 'bottom' || axisView.orient === 'top' ? 'x' : 'y';

  if (scaleType === 'time') {
    for (const datum of data) {
      datum[field] = new Date(datum[field] as string | number);
    }
  }

  return {
    title,
    field,
    scaleType,
    axisType,
  };
}

function parseLegendInformation(spec: any, legendNode: any, _data: OlliDataset): OlliLegend {
  const scaleKeys = Object.keys(legendNode.items[0].datum.scales);
  const scaleName: string = legendNode.items[0].datum.scales[scaleKeys[0]!];
  const scaleSpec = spec.scales?.find((specScale: any) => specScale.name === scaleName);
  const title: string = legendNode.items[0].items.find((n: any) => n.role === 'legend-title').items[0].text;

  let field: string | undefined;
  const legendDomain = scaleSpec?.domain;
  if (legendDomain && 'field' in legendDomain) {
    if (!legendDomain.field?.signal) {
      field = legendDomain.field;
    }
  } else if (legendDomain) {
    if (_data.length > 0 && Object.keys(_data[0]!).some((key) => key.toLocaleLowerCase() === title.toLocaleLowerCase())) {
      field = title.toLocaleLowerCase();
    }
  }

  return {
    channel: scaleName as 'color' | 'opacity' | 'size',
    title,
    field: field as string,
  };
}
