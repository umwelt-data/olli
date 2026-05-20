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
  if (url.endsWith('.csv') || url.endsWith('.tsv')) return 'csv';
  return 'json';
}

export function parseCsv(text: string): any[] {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0]!.split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const obj: Record<string, any> = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]!] = values[i] ?? '';
    }
    return obj;
  });
}
