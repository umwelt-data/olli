import Papa from 'papaparse';

export function filterUniqueObjects<T>(arr: T[]): T[] {
  return arr.filter((value, index) => {
    const _value = JSON.stringify(value);
    return (
      index ===
      arr.findIndex((obj) => {
        return JSON.stringify(obj) === _value;
      })
    );
  });
}

export function inferFormatFromUrl(url: string): string {
  if (url.endsWith('.tsv')) return 'tsv';
  if (url.endsWith('.csv')) return 'csv';
  return 'json';
}

export function parseDelimited(text: string, format?: string): any[] {
  const result = Papa.parse(text, {
    delimiter: format === 'tsv' ? '\t' : undefined,
    header: true,
    dynamicTyping: true,
    skipEmptyLines: 'greedy',
  });
  return result.data;
}

export function parseCsv(text: string): any[] {
  return parseDelimited(text, 'csv');
}

export function parseTsv(text: string): any[] {
  return parseDelimited(text, 'tsv');
}
