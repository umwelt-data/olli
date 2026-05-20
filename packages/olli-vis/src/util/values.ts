import type { OlliDataset, OlliFieldDef, OlliValue } from '../spec/types.js';
import {
  fmtValue as sharedFmtValue,
  dateToTimeUnit as sharedDateToTimeUnit,
  isNumeric,
  minPrecisionForValue,
} from '@umwelt-data/umwelt-utils/description';

export { isNumeric, minPrecisionForValue };

export function fmtValue(value: OlliValue, fieldDef: OlliFieldDef, precision?: number): string {
  return sharedFmtValue(value, fieldDef, precision);
}

export function dateToTimeUnit(date: Date, timeUnit?: string): string {
  return sharedDateToTimeUnit(date, timeUnit);
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
