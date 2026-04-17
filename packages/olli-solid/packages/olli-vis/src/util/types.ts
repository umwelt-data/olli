import type { MeasureType, OlliDataset } from '../spec/types.js';

export function typeInference(data: OlliDataset, field: string): MeasureType {
  const values = data.map((d) => d[field]);

  const tests: Record<string, (x: unknown) => boolean> = {
    boolean: (x) => x === 'true' || x === 'false' || x === true || x === false,
    integer: (x) => !isNaN(+(x as number)) && +(x as number) === ~~(+(x as number)) && !(x instanceof Date),
    number: (x) => !isNaN(+(x as number)) && !(x instanceof Date),
    date: (x) => {
      if (x instanceof Date) return true;
      if (typeof x === 'string' || typeof x === 'number') {
        const d = new Date(x);
        return !isNaN(d.getTime());
      }
      return false;
    },
  };

  let types = ['boolean', 'integer', 'number', 'date'];
  for (const v of values) {
    if (v == null || v !== v) continue;
    types = types.filter((t) => tests[t]!(v));
    if (types.length === 0) break;
  }

  const inference = types.length > 0 ? types[0]! : 'string';
  switch (inference) {
    case 'boolean':
    case 'string':
      return 'nominal';
    case 'integer': {
      const distinct = new Set(values).size;
      if (distinct < 40 && distinct / values.length < 0.05) return 'nominal';
      return 'quantitative';
    }
    case 'number':
      return 'quantitative';
    case 'date':
      return 'temporal';
    default:
      return 'nominal';
  }
}
