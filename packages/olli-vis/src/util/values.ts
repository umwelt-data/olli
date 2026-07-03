import type { OlliDataset, OlliFieldDef, OlliValue } from '../spec/types.js';
import { fmtValue, minPrecisionForValue } from '@umwelt-data/umwelt-utils/description';

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

/** Linear-interpolated quantile (R-7, matching d3/vega) over a field. */
export function quantileValue(data: OlliDataset, field: string, q: number): number {
  const nums = data.map((d) => Number(d[field])).filter((n) => !isNaN(n)).sort((a, b) => a - b);
  if (nums.length === 0) return NaN;
  const pos = (nums.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return nums[lo]! + (nums[hi]! - nums[lo]!) * (pos - lo);
}
