import type { UnitOlliVisSpec } from '../spec/types.js';
import { getMarkType } from '../spec/types.js';
import { getFieldDef } from './data.js';

export function getChartType(spec: UnitOlliVisSpec): string {
  const mt = getMarkType(spec.mark);
  if (!mt) return 'dataset';
  if (mt === 'point' && spec.axes?.length === 2) {
    const allQuant = spec.axes.every(
      (a) => getFieldDef(a.field, spec.fields ?? []).type === 'quantitative',
    );
    if (allQuant) return 'scatterplot';
    const hasQuant = spec.axes.some(
      (a) => getFieldDef(a.field, spec.fields ?? []).type === 'quantitative',
    );
    const noTemporal = !spec.axes.some(
      (a) => getFieldDef(a.field, spec.fields ?? []).type === 'temporal',
    );
    if (hasQuant && noTemporal) return 'dotplot';
  }
  if (mt === 'arc') {
    return typeof spec.mark === 'object' && spec.mark.innerRadius ? 'donut chart' : 'pie chart';
  }
  if (mt === 'geoshape') {
    const colorLegend = spec.legends?.find((l) => l.channel === 'color');
    if (colorLegend) {
      const fd = getFieldDef(colorLegend.field, spec.fields ?? []);
      if (fd.type === 'quantitative') return 'choropleth map';
    }
    return 'map';
  }
  if (mt === 'rect') {
    const colorLegend = spec.legends?.find((l) => l.channel === 'color');
    if (colorLegend) {
      const fd = getFieldDef(colorLegend.field, spec.fields ?? []);
      if (fd.type === 'quantitative') return 'heatmap';
    }
  }
  const stack = typeof spec.mark === 'object' ? spec.mark.stack : undefined;
  if (stack) {
    return `${stack} ${mt} chart`;
  }
  return `${mt} chart`;
}
