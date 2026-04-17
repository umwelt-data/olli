import { olliVis, type OlliHandle, type UnitOlliVisSpec } from 'olli-js';

const spec: UnitOlliVisSpec = {
  data: [
    { category: 'A', value: 28 },
    { category: 'B', value: 55 },
    { category: 'C', value: 43 },
    { category: 'D', value: 91 },
    { category: 'E', value: 81 },
    { category: 'F', value: 53 },
  ],
  mark: 'bar',
  title: 'Simple Bar Chart',
  description: 'A bar chart with 6 categories',
  fields: [
    { field: 'category', type: 'nominal' },
    { field: 'value', type: 'quantitative' },
  ],
  axes: [
    { field: 'category', axisType: 'x', title: 'Category' },
    { field: 'value', axisType: 'y', title: 'Value' },
  ],
};

export function mountBarChart(container: HTMLElement): OlliHandle {
  return olliVis(spec, container, { initialPreset: 'medium' });
}
