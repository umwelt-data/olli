import { parseExpression } from 'vega-expression';

type Datum = Record<string, any>;
type Dataset = Datum[];
type SignalStore = Record<string, any>;

interface VegaDataEntry {
  name: string;
  values?: any[];
  url?: string;
  source?: string;
  format?: any;
  transform?: any[];
}

export function evaluateVegaData(dataEntries: VegaDataEntry[]): Record<string, Dataset> {
  const store: Record<string, Dataset> = {};
  const signals: SignalStore = {};

  for (const entry of dataEntries) {
    let data: Dataset;
    if (entry.values) {
      data = entry.values.map((d) => ({ ...d }));
    } else if (entry.source && store[entry.source]) {
      data = store[entry.source]!.map((d) => ({ ...d }));
    } else {
      data = [];
    }

    if (entry.format?.parse) {
      data = applyFormatParse(data, entry.format.parse);
    }

    if (entry.transform) {
      for (const t of entry.transform) {
        data = applyTransform(data, t, signals);
      }
    }

    store[entry.name] = data;
  }

  return store;
}

export function extractOutputDatasets(
  dataEntries: VegaDataEntry[],
  store: Record<string, Dataset>,
): Dataset[] {
  const dataNames = dataEntries
    .map((e) => e.name)
    .filter((name) => /^data_\d+$/.test(name));

  if (dataNames.length) {
    const extracted = dataNames
      .map((name) => store[name])
      .filter((d): d is Dataset => {
        if (!d || !d.length) return false;
        if (!d[0] || Object.keys(d[0]).length === 0) return false;
        return true;
      })
      .filter((d, idx, self) => {
        return (
          self.findLastIndex(
            (d2) => d2.length > 0 && d2[0] && Object.keys(d2[0]!).every((k) => Object.keys(d[0]!).includes(k)),
          ) === idx
        );
      });
    if (extracted.length) return extracted;
  }

  const sourceNames = dataEntries
    .map((e) => e.name)
    .filter((name) => /^(source|data)_\d+$/.test(name));
  const lastName = sourceNames[sourceNames.length - 1];
  if (lastName && store[lastName]?.length) {
    return [store[lastName]!];
  }

  return [[]];
}

function applyFormatParse(data: Dataset, parse: Record<string, string>): Dataset {
  return data.map((d) => {
    const out = { ...d };
    for (const [field, type] of Object.entries(parse)) {
      if (type === 'date' && out[field] != null) {
        out[field] = new Date(out[field]);
      } else if (type === 'number' && out[field] != null) {
        out[field] = Number(out[field]);
      }
    }
    return out;
  });
}

function applyTransform(data: Dataset, t: any, signals: SignalStore): Dataset {
  switch (t.type) {
    case 'extent':
      return applyExtent(data, t, signals);
    case 'bin':
      return applyBin(data, t, signals);
    case 'aggregate':
      return applyAggregate(data, t);
    case 'filter':
      return applyFilter(data, t);
    case 'formula':
      return applyFormula(data, t);
    case 'timeunit':
      return applyTimeUnit(data, t);
    case 'stack':
      return applyStack(data, t);
    case 'impute':
      return applyImpute(data, t);
    case 'collect':
      return applyCollect(data, t);
    case 'identifier':
      return applyIdentifier(data, t);
    case 'sequence':
      return applySequence(t, signals);
    default:
      return data;
  }
}

function resolveSignalRef(value: any, signals: SignalStore): any {
  if (value && typeof value === 'object' && 'signal' in value) {
    return signals[value.signal];
  }
  return value;
}

function applyExtent(data: Dataset, t: any, signals: SignalStore): Dataset {
  const field = t.field as string;
  let min = Infinity;
  let max = -Infinity;
  for (const d of data) {
    const v = Number(d[field]);
    if (!isNaN(v) && isFinite(v)) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (t.signal) {
    signals[t.signal] = [min, max];
  }
  return data;
}

function vegaBin(params: { extent: [number, number]; maxbins?: number; step?: number; steps?: number[]; minstep?: number; nice?: boolean; base?: number; divide?: number[] }) {
  const maxb = params.maxbins || 20;
  const base = params.base || 10;
  const logb = Math.log(base);
  const div = params.divide || [5, 2];

  let min = params.extent[0]!;
  let max = params.extent[1]!;
  let step: number;
  let v: number;
  let i: number;
  let n: number;

  const span = max - min || Math.abs(min) || 1;

  if (params.step) {
    step = params.step;
  } else if (params.steps) {
    v = span / maxb;
    for (i = 0, n = params.steps.length; i < n && params.steps[i]! < v; ++i);
    step = params.steps[Math.max(0, i - 1)]!;
  } else {
    const level = Math.ceil(Math.log(maxb) / logb);
    const minstep = params.minstep || 0;
    step = Math.max(minstep, Math.pow(base, Math.round(Math.log(span) / logb) - level));

    while (Math.ceil(span / step) > maxb) {
      step *= base;
    }

    for (i = 0, n = div.length; i < n; ++i) {
      v = step / div[i]!;
      if (v >= minstep && span / v <= maxb) step = v;
    }
  }

  v = Math.log(step);
  const precision = v >= 0 ? 0 : ~~(-v / logb) + 1;
  const eps = Math.pow(base, -precision - 1);
  if (params.nice || params.nice === undefined) {
    v = Math.floor(min / step + eps) * step;
    min = min < v ? v - step : v;
    max = Math.ceil(max / step) * step;
  }

  return {
    start: min,
    stop: max === min ? min + step : max,
    step,
  };
}

function applyBin(data: Dataset, t: any, signals: SignalStore): Dataset {
  const field = t.field as string;
  const [asStart, asEnd] = t.as as [string, string];
  const extent = resolveSignalRef(t.extent, signals) as [number, number];
  const binParams = vegaBin({
    extent,
    maxbins: t.maxbins,
    step: t.step,
    steps: t.steps,
    minstep: t.minstep,
    nice: t.nice,
    base: t.base,
    divide: t.divide,
  });

  if (t.signal) {
    signals[t.signal] = binParams;
  }

  return data.map((d) => {
    const v = Number(d[field]);
    const out = { ...d };
    if (isNaN(v) || !isFinite(v)) {
      out[asStart] = null;
      out[asEnd] = null;
    } else {
      const binIdx = Math.floor((v - binParams.start) / binParams.step);
      const binStart = binParams.start + binIdx * binParams.step;
      const binEnd = binStart + binParams.step;
      out[asStart] = binStart;
      out[asEnd] = Math.min(binEnd, binParams.stop);
    }
    return out;
  });
}

function applyAggregate(data: Dataset, t: any): Dataset {
  const groupby: string[] = t.groupby || [];
  const ops: string[] = t.ops || [];
  const fields: (string | null)[] = t.fields || [];
  const asNames: string[] = t.as || [];

  const groups = new Map<string, Dataset>();
  for (const d of data) {
    const key = groupby.map((g) => JSON.stringify(d[g])).join('|');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(d);
  }

  if (ops.length === 0 && groupby.length > 0) {
    return [...groups.entries()].map(([, rows]) => {
      const out: Datum = {};
      for (const g of groupby) {
        out[g] = rows[0]![g];
      }
      return out;
    });
  }

  return [...groups.entries()].map(([, rows]) => {
    const out: Datum = {};
    for (const g of groupby) {
      out[g] = rows[0]![g];
    }
    for (let i = 0; i < ops.length; i++) {
      const op = ops[i]!;
      const field = fields[i];
      const as = asNames[i] || (field ? `${op}_${field}` : `__${op}`);
      out[as] = computeAggOp(op, rows, field ?? undefined);
    }
    return out;
  });
}

function computeAggOp(op: string, rows: Dataset, field?: string): any {
  const values = field ? rows.map((d) => d[field]).filter((v) => v != null) : rows;
  const nums = field ? values.map(Number).filter((v) => !isNaN(v)) : [];

  switch (op) {
    case 'count':
      return rows.length;
    case 'valid':
      return values.length;
    case 'sum':
      return nums.reduce((a, b) => a + b, 0);
    case 'mean':
    case 'average':
      return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
    case 'min':
      return nums.length ? Math.min(...nums) : null;
    case 'max':
      return nums.length ? Math.max(...nums) : null;
    case 'median': {
      if (!nums.length) return null;
      const sorted = [...nums].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1]! + sorted[mid]!) / 2;
    }
    case 'variance': {
      if (nums.length < 2) return 0;
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      return nums.reduce((a, b) => a + (b - mean) ** 2, 0) / (nums.length - 1);
    }
    case 'stdev': {
      if (nums.length < 2) return 0;
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      return Math.sqrt(nums.reduce((a, b) => a + (b - mean) ** 2, 0) / (nums.length - 1));
    }
    case 'distinct':
      return new Set(values).size;
    case 'missing':
      return rows.length - values.length;
    case 'values':
      return values;
    default:
      return null;
  }
}

function applyFilter(data: Dataset, t: any): Dataset {
  const expr = t.expr as string;
  const evalFn = compileExpression(expr);
  return data.filter((d) => evalFn(d));
}

function applyFormula(data: Dataset, t: any): Dataset {
  const expr = t.expr as string;
  const as = t.as as string;
  const evalFn = compileExpression(expr);
  return data.map((d) => {
    const out = { ...d };
    out[as] = evalFn(d);
    return out;
  });
}

function applyTimeUnit(data: Dataset, t: any): Dataset {
  const field = t.field as string;
  const units: string[] = t.units;
  const [asStart, asEnd] = t.as as [string, string];

  return data.map((d) => {
    const out = { ...d };
    const val = d[field];
    if (val == null) {
      out[asStart] = null;
      out[asEnd] = null;
      return out;
    }

    const date = val instanceof Date ? val : new Date(val);
    if (isNaN(date.getTime())) {
      out[asStart] = null;
      out[asEnd] = null;
      return out;
    }

    const floored = floorDate(date, units);
    out[asStart] = floored;
    out[asEnd] = ceilDate(floored, units);
    return out;
  });
}

function floorDate(date: Date, units: string[]): Date {
  const d = new Date(date);
  const has = (u: string) => units.includes(u);

  if (!has('year')) d.setFullYear(2012);
  if (!has('month')) d.setMonth(0);
  if (!has('date') && !has('day')) d.setDate(1);
  if (!has('hours')) d.setHours(0);
  if (!has('minutes')) d.setMinutes(0);
  if (!has('seconds')) d.setSeconds(0);
  d.setMilliseconds(0);

  return d;
}

function ceilDate(floored: Date, units: string[]): Date {
  const d = new Date(floored);
  const smallest = [...units].reverse()[0];
  switch (smallest) {
    case 'year':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case 'month':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'date':
    case 'day':
      d.setDate(d.getDate() + 1);
      break;
    case 'hours':
      d.setHours(d.getHours() + 1);
      break;
    case 'minutes':
      d.setMinutes(d.getMinutes() + 1);
      break;
    case 'seconds':
      d.setSeconds(d.getSeconds() + 1);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }
  return d;
}

function applyStack(data: Dataset, t: any): Dataset {
  const groupby: string[] = t.groupby || [];
  const field = t.field as string;
  const [asStart, asEnd] = t.as as [string, string];
  const sortFields: string[] = t.sort?.field || [];
  const sortOrders: string[] = t.sort?.order || [];
  const offset: string = t.offset || 'zero';

  const groups = new Map<string, Dataset>();
  for (const d of data) {
    const key = groupby.map((g) => JSON.stringify(d[g])).join('|');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(d);
  }

  const result: Dataset = [];
  for (const [, rows] of groups) {
    rows.sort((a, b) => {
      for (let i = 0; i < sortFields.length; i++) {
        const f = sortFields[i]!;
        const order = sortOrders[i] === 'descending' ? -1 : 1;
        const va = a[f];
        const vb = b[f];
        if (va < vb) return -order;
        if (va > vb) return order;
      }
      return 0;
    });

    if (offset === 'normalize') {
      const total = rows.reduce((s, d) => s + (Number(d[field]) || 0), 0);
      let pos = 0;
      let neg = 0;
      for (const d of rows) {
        const v = total ? (Number(d[field]) || 0) / total : 0;
        const out = { ...d };
        if (v >= 0) {
          out[asStart] = pos;
          pos += v;
          out[asEnd] = pos;
        } else {
          out[asEnd] = neg;
          neg += v;
          out[asStart] = neg;
        }
        result.push(out);
      }
    } else if (offset === 'center') {
      const total = rows.reduce((s, d) => s + Math.abs(Number(d[field]) || 0), 0);
      let cum = -total / 2;
      for (const d of rows) {
        const v = Number(d[field]) || 0;
        const out = { ...d };
        out[asStart] = cum;
        cum += v;
        out[asEnd] = cum;
        result.push(out);
      }
    } else {
      let pos = 0;
      let neg = 0;
      for (const d of rows) {
        const v = Number(d[field]) || 0;
        const out = { ...d };
        if (v >= 0) {
          out[asStart] = pos;
          pos += v;
          out[asEnd] = pos;
        } else {
          out[asEnd] = neg;
          neg += v;
          out[asStart] = neg;
        }
        result.push(out);
      }
    }
  }

  return result;
}

function applyImpute(data: Dataset, t: any): Dataset {
  const field = t.field as string;
  const key = t.key as string;
  const groupby: string[] = t.groupby || [];
  const value = t.value;

  const allKeys = new Set<any>();
  for (const d of data) {
    allKeys.add(JSON.stringify(d[key]));
  }

  const groups = new Map<string, Map<string, Datum>>();
  for (const d of data) {
    const gKey = groupby.map((g) => JSON.stringify(d[g])).join('|');
    if (!groups.has(gKey)) groups.set(gKey, new Map());
    groups.get(gKey)!.set(JSON.stringify(d[key]), d);
  }

  const result: Dataset = [];
  for (const [, groupMap] of groups) {
    const sample = [...groupMap.values()][0]!;
    for (const kStr of allKeys) {
      if (groupMap.has(kStr)) {
        result.push({ ...groupMap.get(kStr)! });
      } else {
        const imputed: Datum = {};
        for (const g of groupby) {
          imputed[g] = sample[g];
        }
        imputed[key] = JSON.parse(kStr);
        imputed[field] = value;
        result.push(imputed);
      }
    }
  }

  return result;
}

function applyCollect(data: Dataset, t: any): Dataset {
  if (!t.sort) return data;
  const fields: string[] = Array.isArray(t.sort.field) ? t.sort.field : [t.sort.field];
  const orders: string[] = Array.isArray(t.sort.order) ? t.sort.order : [t.sort.order || 'ascending'];

  return [...data].sort((a, b) => {
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i]!;
      const order = orders[i] === 'descending' ? -1 : 1;
      const va = a[f];
      const vb = b[f];
      if (va < vb) return -order;
      if (va > vb) return order;
    }
    return 0;
  });
}

function applyIdentifier(data: Dataset, t: any): Dataset {
  const as = t.as as string;
  return data.map((d, i) => ({ ...d, [as]: i }));
}

function applySequence(t: any, signals: SignalStore): Dataset {
  const start = resolveSignalRef(t.start, signals) ?? 0;
  const stop = resolveSignalRef(t.stop, signals) ?? 0;
  const step = resolveSignalRef(t.step, signals) ?? 1;
  const as = t.as || 'data';
  const result: Dataset = [];
  for (let i = start; i < stop; i += step) {
    result.push({ [as]: i });
  }
  return result;
}

// --- Expression evaluator ---

function compileExpression(expr: string): (datum: Datum) => any {
  try {
    const ast = parseExpression(expr);
    return (datum: Datum) => evalNode(ast, datum);
  } catch {
    return () => true;
  }
}

function evalNode(node: any, datum: Datum): any {
  switch (node.type) {
    case 'Literal':
      return node.value;

    case 'Identifier':
      if (node.name === 'datum') return datum;
      if (node.name === 'NaN') return NaN;
      if (node.name === 'Infinity') return Infinity;
      if (node.name === 'undefined') return undefined;
      if (node.name === 'null') return null;
      if (node.name === 'true') return true;
      if (node.name === 'false') return false;
      if (node.name === 'E') return Math.E;
      if (node.name === 'PI') return Math.PI;
      return undefined;

    case 'MemberExpression': {
      const obj = evalNode(node.object, datum);
      if (obj == null) return undefined;
      const prop = node.computed ? evalNode(node.property, datum) : node.property.name;
      return obj[prop];
    }

    case 'BinaryExpression':
    case 'LogicalExpression':
      return evalBinary(node.operator, evalNode(node.left, datum), node, datum);

    case 'UnaryExpression': {
      const arg = evalNode(node.argument, datum);
      switch (node.operator) {
        case '-': return -arg;
        case '+': return +arg;
        case '!': return !arg;
        case '~': return ~arg;
      }
      return undefined;
    }

    case 'ConditionalExpression':
      return evalNode(node.test, datum) ? evalNode(node.consequent, datum) : evalNode(node.alternate, datum);

    case 'CallExpression': {
      const fnName = node.callee.name || (node.callee.property && node.callee.property.name);
      const args = node.arguments.map((a: any) => evalNode(a, datum));
      return evalCallExpression(fnName, args);
    }

    case 'ArrayExpression':
      return node.elements.map((e: any) => evalNode(e, datum));

    case 'ObjectExpression': {
      const obj: Record<string, any> = {};
      for (const prop of node.properties) {
        const key = prop.key.name || prop.key.value;
        obj[key] = evalNode(prop.value, datum);
      }
      return obj;
    }

    default:
      return undefined;
  }
}

function evalBinary(op: string, left: any, node: any, datum: Datum): any {
  switch (op) {
    case '===': return left === evalNode(node.right, datum);
    case '!==': return left !== evalNode(node.right, datum);
    case '==': return left == evalNode(node.right, datum);
    case '!=': return left != evalNode(node.right, datum);
    case '<': return left < evalNode(node.right, datum);
    case '>': return left > evalNode(node.right, datum);
    case '<=': return left <= evalNode(node.right, datum);
    case '>=': return left >= evalNode(node.right, datum);
    case '+': return left + evalNode(node.right, datum);
    case '-': return left - evalNode(node.right, datum);
    case '*': return left * evalNode(node.right, datum);
    case '/': return left / evalNode(node.right, datum);
    case '%': return left % evalNode(node.right, datum);
    case '**': return left ** evalNode(node.right, datum);
    case '|': return left | evalNode(node.right, datum);
    case '&': return left & evalNode(node.right, datum);
    case '^': return left ^ evalNode(node.right, datum);
    case '<<': return left << evalNode(node.right, datum);
    case '>>': return left >> evalNode(node.right, datum);
    case '>>>': return left >>> evalNode(node.right, datum);
    case '&&': return left && evalNode(node.right, datum);
    case '||': return left || evalNode(node.right, datum);
    default: return undefined;
  }
}

function evalCallExpression(fnName: string, args: any[]): any {
  switch (fnName) {
    case 'isValid':
      return args[0] != null && args[0] === args[0];
    case 'isFinite':
      return Number.isFinite(args[0]);
    case 'isNaN':
      return Number.isNaN(args[0]);
    case 'toNumber':
      return Number(args[0]);
    case 'toDate':
      return new Date(args[0]);
    case 'toString':
      return String(args[0]);
    case 'toBoolean':
      return Boolean(args[0]);
    case 'if':
      return args[0] ? args[1] : args[2];
    case 'format':
      return String(args[0]);
    case 'length':
      return args[0]?.length ?? 0;
    case 'abs':
    case 'Math.abs':
      return Math.abs(args[0]);
    case 'ceil':
    case 'Math.ceil':
      return Math.ceil(args[0]);
    case 'floor':
    case 'Math.floor':
      return Math.floor(args[0]);
    case 'round':
    case 'Math.round':
      return Math.round(args[0]);
    case 'sqrt':
    case 'Math.sqrt':
      return Math.sqrt(args[0]);
    case 'log':
    case 'Math.log':
      return Math.log(args[0]);
    case 'exp':
    case 'Math.exp':
      return Math.exp(args[0]);
    case 'pow':
    case 'Math.pow':
      return Math.pow(args[0], args[1]);
    case 'min':
    case 'Math.min':
      return Math.min(...args);
    case 'max':
    case 'Math.max':
      return Math.max(...args);
    case 'year':
      return args[0] instanceof Date ? args[0].getFullYear() : new Date(args[0]).getFullYear();
    case 'month':
      return args[0] instanceof Date ? args[0].getMonth() : new Date(args[0]).getMonth();
    case 'date':
      return args[0] instanceof Date ? args[0].getDate() : new Date(args[0]).getDate();
    case 'day':
      return args[0] instanceof Date ? args[0].getDay() : new Date(args[0]).getDay();
    case 'hours':
      return args[0] instanceof Date ? args[0].getHours() : new Date(args[0]).getHours();
    case 'minutes':
      return args[0] instanceof Date ? args[0].getMinutes() : new Date(args[0]).getMinutes();
    case 'seconds':
      return args[0] instanceof Date ? args[0].getSeconds() : new Date(args[0]).getSeconds();
    case 'time':
      return args[0] instanceof Date ? args[0].getTime() : new Date(args[0]).getTime();
    case 'utcyear':
      return args[0] instanceof Date ? args[0].getUTCFullYear() : new Date(args[0]).getUTCFullYear();
    case 'utcmonth':
      return args[0] instanceof Date ? args[0].getUTCMonth() : new Date(args[0]).getUTCMonth();
    case 'utcdate':
      return args[0] instanceof Date ? args[0].getUTCDate() : new Date(args[0]).getUTCDate();
    case 'datetime':
      return new Date(args[0], args[1] ?? 0, args[2] ?? 1, args[3] ?? 0, args[4] ?? 0, args[5] ?? 0, args[6] ?? 0);
    case 'utc':
      return new Date(Date.UTC(args[0], args[1] ?? 0, args[2] ?? 1, args[3] ?? 0, args[4] ?? 0, args[5] ?? 0, args[6] ?? 0));
    case 'now':
      return Date.now();
    case 'indexof':
      return args[0]?.indexOf?.(args[1]) ?? -1;
    case 'lastindexof':
      return args[0]?.lastIndexOf?.(args[1]) ?? -1;
    case 'slice':
      return args[0]?.slice?.(args[1], args[2]);
    case 'replace':
      return typeof args[0] === 'string' ? args[0].replace(args[1], args[2]) : args[0];
    case 'trim':
      return typeof args[0] === 'string' ? args[0].trim() : args[0];
    case 'lower':
      return typeof args[0] === 'string' ? args[0].toLowerCase() : args[0];
    case 'upper':
      return typeof args[0] === 'string' ? args[0].toUpperCase() : args[0];
    case 'substring':
      return typeof args[0] === 'string' ? args[0].substring(args[1], args[2]) : args[0];
    case 'test': {
      try {
        const re = new RegExp(args[0]);
        return re.test(args[1]);
      } catch {
        return false;
      }
    }
    default:
      return undefined;
  }
}
