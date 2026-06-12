import type { OlliVisSpec, UnitOlliVisSpec, OlliFieldDef } from './types.js';
import { isMultiSpec } from './types.js';
import { typeInference } from '../util/types.js';
import { inferStructure } from './infer.js';

export function elaborateSpec(spec: OlliVisSpec): OlliVisSpec {
  if (isMultiSpec(spec)) {
    return { ...spec, units: spec.units.map(elaborateUnit) };
  }
  return elaborateUnit(spec);
}

function elaborateUnit(spec: UnitOlliVisSpec): UnitOlliVisSpec {
  const out = { ...spec };

  if (!out.fields || out.fields.length === 0) {
    const keys = out.data.length > 0 ? Object.keys(out.data[0]!) : [];
    out.fields = keys.map((field) => ({ field }));
  }

  out.fields = out.fields.map((f) => {
    if (f.type) return f;
    return { ...f, type: typeInference(out.data, f.field) };
  });

  if (!out.structure) {
    out.structure = inferStructure(out);
  }

  if (out.annotations?.length) {
    const nodes = Array.isArray(out.structure) ? out.structure : out.structure ? [out.structure] : [];
    // idempotent: elaborate may run more than once on the same spec
    if (!nodes.some((n) => 'annotations' in n)) {
      out.structure = [...nodes, { annotations: out.annotations }];
    }
  }

  return out;
}
