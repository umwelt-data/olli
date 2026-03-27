import { TopLevelSpec, compile } from 'vega-lite';
import { VisAdapter, UnitOlliSpec, typeInference, OlliSpec, OlliDataset, MultiSpecOperator } from 'olli';
import { getData, getVegaAxisTicks, getVegaScene, getVegaView } from './utils';
import { TopLevelUnitSpec } from 'vega-lite/build/src/spec/unit';
import { TopLevel, LayerSpec, GenericHConcatSpec, GenericVConcatSpec } from 'vega-lite/build/src/spec';
import { GenericConcatSpec } from 'vega-lite/build/src/spec/concat';
import { Scene, SceneGroup, View } from 'vega';

const getMark = (spec: any) => {
  // TODO vega-lite mark type exceeds olli mark type, should do some validation
  const mark: any = spec.mark;
  if (mark && mark.type) {
    // e.g. "mark": {"type": "line", "point": true}
    return mark.type;
  }
  return mark;
};

const isScalarValue = (value: unknown) => {
  return value === null || value === undefined || typeof value !== 'object' || value instanceof Date;
};

const inferRegionField = (data: OlliDataset, fields: { field: string; type?: string }[]): string | undefined => {
  if (!data.length) {
    return fields[0]?.field;
  }

  const keys = Object.keys(data[0]);
  const scalarKeys = keys.filter((key) => data.every((datum) => isScalarValue(datum[key])));

  const preferred = [
    'region',
    'name',
    'state',
    'state_name',
    'county',
    'county_name',
    'province',
    'country',
    'district',
    'county_id',
    'state_id',
    'id',
  ].find((key) => scalarKeys.includes(key));
  if (preferred) {
    return preferred;
  }

  const nominal = fields.find((field) => field.type === 'nominal' || field.type === 'ordinal');
  if (nominal) {
    return nominal.field;
  }

  const scalarNominal = scalarKeys.find((field) => typeInference(data, field) === 'nominal');
  if (scalarNominal) {
    return scalarNominal;
  }

  if (scalarKeys.length) {
    return scalarKeys[0];
  }

  return fields[0]?.field;
};

/**
 * Adapter to deconstruct Vega-Lite visualizations into an {@link OlliVisSpec}
 * @param spec The Vega-Lite Spec that rendered the visualization
 * @returns An {@link OlliVisSpec} of the deconstructed Vega-Lite visualization
 */
export const VegaLiteAdapter: VisAdapter<TopLevelSpec> = async (spec: TopLevelSpec): Promise<OlliSpec> => {
  const view = await getVegaView(compile(spec).spec);
  const scene = getVegaScene(view);
  const data = getData(scene);

  if ('mark' in spec) {
    return adaptUnitSpec(scene, spec, data[0]);
  } else {
    if ('layer' in spec || 'concat' in spec || 'hconcat' in spec || 'vconcat' in spec) {
      const vlOp = Object.keys(spec).find((k) => ['layer', 'concat', 'hconcat', 'vconcat'].includes(k));
      return await adaptMultiSpec(scene, spec, vlOp, data);
    }
  }
};

const getFieldFromEncoding = (encoding, data: OlliDataset) => {
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
    const fields = Object.keys(data[0]);
    const binField = fields.find((f) => f.startsWith('bin') && f.includes(encoding.field) && !f.endsWith('_end'));
    return binField;
  }

  return 'condition' in encoding ? encoding.condition.field : encoding.field;
};

const getLabelFromEncoding = (encoding) => {
  if ('aggregate' in encoding) {
    if (encoding.aggregate === 'count') {
      return 'count';
    }
  }
  return `${encoding.bin ? 'binned ' : ''}${'aggregate' in encoding ? `${encoding.aggregate} ` : ''}${
    'condition' in encoding ? encoding.condition.field : encoding.field
  }${'timeUnit' in encoding && !(encoding.timeUnit === encoding.field.toLowerCase()) ? ` (${encoding.timeUnit})` : ''}`;
};

const typeCoerceData = (olliSpec: UnitOlliSpec) => {
  olliSpec.fields.forEach((fieldDef) => {
    if (fieldDef.type === 'temporal') {
      // convert temporal data into Date objects
      olliSpec.data.forEach((datum) => {
        datum[fieldDef.field] = new Date(datum[fieldDef.field]);
      });
    }
  });
};

function adaptUnitSpec(scene: SceneGroup, spec: TopLevelUnitSpec<any>, data: OlliDataset): UnitOlliSpec {
  // unit spec
  const olliSpec: UnitOlliSpec = {
    description: spec.description,
    data: data,
    fields: [],
    axes: [],
    legends: [],
    guides: [],
  };

  olliSpec.mark = getMark(spec);

  if (spec.encoding) {
    Object.entries(spec.encoding).forEach(([channel, encoding]) => {
      const fieldDef = { ...encoding };
      fieldDef.field = getFieldFromEncoding(encoding, data);
      fieldDef.label = getLabelFromEncoding(encoding);
      fieldDef.type =
        encoding.type ||
        (encoding.timeUnit ? 'temporal' : false) ||
        (encoding.bin ? 'quantitative' : false) ||
        typeInference(data, fieldDef.field);

      if (!fieldDef.field) {
        return;
      }
      if (olliSpec.mark === 'geoshape' && (channel === 'shape' || fieldDef.type === 'geojson')) {
        // Geometry objects are not directly navigable by Olli. We keep scalar metadata fields only.
        return;
      }
      if (['row', 'column', 'facet'].includes(channel)) {
        // add facet field
        olliSpec.facet = fieldDef.field;
      } else if (olliSpec.mark === 'line' && ['color', 'detail'].includes(channel)) {
        // treat multi-series line charts as facets
        olliSpec.facet = fieldDef.field;
      } else if (['x', 'y'].includes(channel)) {
        // add axes
        const ticks = getVegaAxisTicks(scene);
        olliSpec.axes.push({
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
        // add legends
        olliSpec.legends.push({
          channel: channel as any,
          field: fieldDef.field,
          title: encoding.title,
        });
      } else if (channel === 'order') {
        olliSpec.guides.push({
          field: fieldDef.field,
          title: encoding.title,
          channel: channel,
        });
      } else {
        // TODO: handle other channels
      }

      // add field to list of field defs
      if (!olliSpec.fields.find((f) => f.field === fieldDef.field)) {
        olliSpec.fields.push(fieldDef);
      }
    });
  }

  if (olliSpec.mark === 'geoshape') {
    const regionField = inferRegionField(olliSpec.data, olliSpec.fields);
    if (regionField) {
      const fieldDef = olliSpec.fields.find((f) => f.field === regionField);
      if (fieldDef) {
        fieldDef.type = 'nominal';
      } else {
        olliSpec.fields.push({
          field: regionField,
          label: regionField,
          type: 'nominal',
        });
      }
      olliSpec.structure = [{ groupby: regionField, children: [] }];
    }
  }

  typeCoerceData(olliSpec);

  return olliSpec;
}

async function adaptMultiSpec(
  scene: SceneGroup,
  spec: TopLevel<LayerSpec<any> | GenericConcatSpec<any> | GenericVConcatSpec<any> | GenericHConcatSpec<any>>,
  vlOp: string,
  data: OlliDataset[]
): Promise<OlliSpec> {
  const units: UnitOlliSpec[] = data.map((d) => {
    return {
      description: spec.description,
      data: d,
      fields: [],
      axes: [],
      legends: [],
    };
  });

  spec[vlOp].map((view) => {
    if ('mark' in view) {
      // unit view
      const viewSpec = {
        data: view.data || spec.data,
        mark: view.mark,
        encoding: view.encoding,
      };
      const dataset = data.find((d) => {
        const fields = Object.keys(d[0]);
        const viewFields = Object.values(viewSpec.encoding)
          .map((f) => getFieldFromEncoding(f, d))
          .filter((f) => f);
        return viewFields.every((f) => fields.includes(f));
      });
      const viewOlliSpec = adaptUnitSpec(scene, viewSpec, dataset);
      const unitSpec = units.find((s) => Object.keys(s.data[0]).every((k) => k in dataset[0]));
      if (unitSpec) {
        unitSpec.fields.push(...viewOlliSpec.fields);
        unitSpec.axes.push(...viewOlliSpec.axes);
        unitSpec.legends.push(...viewOlliSpec.legends);
        unitSpec.mark = viewOlliSpec.mark;
      }
    } else {
      // TODO: nested layer/concat
    }
  });

  units.forEach((s) => {
    s.fields = s.fields.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);
    s.axes = s.axes.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);
    s.legends = s.legends.filter((f, i, self) => self.findIndex((f2) => f2.field === f.field) === i);

    typeCoerceData(s);
  });

  if (units.length === 1) {
    return units[0];
  }

  return {
    operator: vlOp === 'layer' ? 'layer' : 'concat',
    units,
  };
}
