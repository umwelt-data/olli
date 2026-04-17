import type { UnitOlliVisSpec, OlliVisSpec, OlliDataset, OlliAxis, OlliLegend, OlliMark } from 'olli-vis';
import { typeInference } from 'olli-vis';
import { getData, getVegaAxisTicks, getVegaScene, getVegaView } from './utils.js';
import type { VisAdapter } from './types.js';

export const VegaLiteAdapter: VisAdapter<any> = async (spec: any): Promise<OlliVisSpec> => {
  const vegaLite = await import('vega-lite');
  const view = await getVegaView(vegaLite.compile(spec).spec);
  const scene = getVegaScene(view);
  const data = getData(scene);

  if ('mark' in spec) {
    return adaptUnitSpec(scene, spec, data[0]!);
  } else {
    if ('layer' in spec || 'concat' in spec || 'hconcat' in spec || 'vconcat' in spec) {
      const vlOp = Object.keys(spec).find((k) => ['layer', 'concat', 'hconcat', 'vconcat'].includes(k))!;
      return await adaptMultiSpec(scene, spec, vlOp, data);
    }
  }

  return adaptUnitSpec(scene, spec, data[0]!);
};

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

function typeCoerceData(olliSpec: UnitOlliVisSpec): void {
  if (!olliSpec.fields) return;
  for (const fieldDef of olliSpec.fields) {
    if (fieldDef.type === 'temporal') {
      for (const datum of olliSpec.data) {
        datum[fieldDef.field] = new Date(datum[fieldDef.field] as string | number);
      }
    }
  }
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
    if (mark && mark.type) {
      return mark.type;
    }
    return mark;
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
        const ticks = getVegaAxisTicks(scene);
        olliSpec.axes!.push({
          axisType: channel as 'x' | 'y',
          field: fieldDef.field,
          title: encoding.title,
          ticks:
            ticks && ticks.length
              ? ticks.length === 1
                ? ticks[0]
                : ticks.length === 2 && channel === 'x'
                  ? ticks[0]
                  : ticks[1]
              : undefined,
        });
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

  typeCoerceData(olliSpec);

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
      const viewSpec = {
        data: view.data || spec.data,
        mark: view.mark,
        encoding: view.encoding,
      };
      const dataset = data.find((d) => {
        if (!d.length) return false;
        const fields = Object.keys(d[0]!);
        const viewFields = Object.values(viewSpec.encoding)
          .map((f: any) => getFieldFromEncoding(f, d))
          .filter((f): f is string => !!f);
        return viewFields.every((f) => fields.includes(f));
      });
      if (!dataset) continue;
      const viewOlliSpec = adaptUnitSpec(scene, viewSpec, dataset);
      const unitSpec = units.find((s) => s.data.length > 0 && Object.keys(s.data[0]!).every((k) => k in dataset[0]!));
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
    typeCoerceData(s);
  }

  if (units.length === 1) {
    return units[0]!;
  }

  return {
    operator: vlOp === 'layer' ? 'layer' : 'concat',
    units,
  };
}
