import type { OlliDataset, OlliFieldDef, OlliTimeUnit, OlliValue } from '../spec/types.js';

export function fmtValue(value: OlliValue, fieldDef: OlliFieldDef, precision?: number): string {
  if (fieldDef.type === 'temporal' && !(value instanceof Date)) {
    value = new Date(value);
  } else if (fieldDef.type === 'quantitative' && isNumeric(String(value))) {
    value = Number(String(value));
  }
  if (value instanceof Date) {
    return dateToTimeUnit(value, fieldDef.timeUnit);
  }
  if (typeof value === 'number' && !isNaN(value)) {
    if (precision !== undefined) {
      return value.toFixed(precision);
    }
    if (value % 1 !== 0) {
      return value.toFixed(Math.max(2, minPrecisionForValue(value)));
    }
  }
  return String(value);
}

export function dateToTimeUnit(date: Date, timeUnit?: OlliTimeUnit): string {
  if (!timeUnit) {
    return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  const opts: Intl.DateTimeFormatOptions = {};
  if (timeUnit.includes('year')) opts.year = 'numeric';
  if (timeUnit.includes('month')) opts.month = 'short';
  if (timeUnit.includes('day')) opts.weekday = 'short';
  if (timeUnit.includes('date')) opts.day = 'numeric';
  if (timeUnit.includes('hours')) opts.hour = 'numeric';
  if (timeUnit.includes('minutes')) opts.minute = 'numeric';
  if (timeUnit.includes('seconds')) opts.second = 'numeric';
  if (Object.keys(opts).length === 0) {
    return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  return date.toLocaleString('en-US', opts);
}

export function serializeValue(value: unknown, fieldDef: OlliFieldDef): unknown {
  if (fieldDef.type === 'temporal') {
    if (Array.isArray(value)) return value.map((v) => new Date(v as string).getTime());
    return new Date(value as string).getTime();
  }
  if (fieldDef.type === 'quantitative' && typeof value === 'string' && isNumeric(value)) {
    return Number(value);
  }
  return value;
}

export function isNumeric(value: string): boolean {
  return !isNaN(Number(value.replaceAll(',', '')));
}

export function minPrecisionForValue(value: number): number {
  if (value === 0 || Math.abs(value) >= 1) return 0;
  return -Math.floor(Math.log10(Math.abs(value)));
}

export function dataPrecision(data: OlliDataset, field: string): number {
  let maxDecimals = 0;
  let maxMinPrecision = 0;
  for (const row of data) {
    const val = row[field];
    if (val == null) continue;
    const str = String(val);
    const dotIndex = str.indexOf('.');
    if (dotIndex >= 0) {
      maxDecimals = Math.max(maxDecimals, str.length - dotIndex - 1);
    }
    const num = Number(val);
    if (!isNaN(num)) {
      maxMinPrecision = Math.max(maxMinPrecision, minPrecisionForValue(num));
    }
  }
  return Math.min(maxDecimals, Math.max(2, maxMinPrecision));
}

export function pluralize(count: number, noun: string, suffix = 's'): string {
  return `${count} ${noun}${count !== 1 ? suffix : ''}`;
}

export function ordinalSuffix(i: number): string {
  const j = i % 10;
  const k = i % 100;
  if (j === 1 && k !== 11) return `${i}st`;
  if (j === 2 && k !== 12) return `${i}nd`;
  if (j === 3 && k !== 13) return `${i}rd`;
  return `${i}th`;
}

export { capitalizeFirst, removeFinalPeriod } from 'olli-core';

export function wrapForMonospace(name: string): string {
  return '`' + name + '`';
}

export function fmtDataValue(value: OlliValue, fieldDef: OlliFieldDef, precision?: number): string {
  return wrapForMonospace(fmtValue(value, fieldDef, precision));
}

export function averageValue(data: OlliDataset, field: string): number {
  return data.reduce((a, b) => a + Number(b[field]), 0) / data.length;
}
