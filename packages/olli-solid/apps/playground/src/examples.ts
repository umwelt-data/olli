import type { OlliHandle } from 'olli-js';
import { olliVis, olliDiagram, olli } from 'olli-js';
import { buildHypergraph } from 'olli-core';
import type { UnitOlliVisSpec } from 'olli-vis';
import { pulleySpec } from 'olli-diagram';

const barChartSpec: UnitOlliVisSpec = {
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

const lineChartSpec: UnitOlliVisSpec = {
  data: [
    { month: 'Jan', sales: 120 },
    { month: 'Feb', sales: 180 },
    { month: 'Mar', sales: 150 },
    { month: 'Apr', sales: 210 },
    { month: 'May', sales: 170 },
    { month: 'Jun', sales: 240 },
  ],
  mark: 'line',
  title: 'Monthly Sales',
  fields: [
    { field: 'month', type: 'ordinal' },
    { field: 'sales', type: 'quantitative' },
  ],
  axes: [
    { field: 'month', axisType: 'x', title: 'Month' },
    { field: 'sales', axisType: 'y', title: 'Sales ($)' },
  ],
};

const rawGraph = buildHypergraph([
  { id: 'system', displayName: 'Solar System', children: ['inner', 'outer'], parents: [] },
  { id: 'inner', displayName: 'Inner Planets', children: ['mercury', 'venus', 'earth', 'mars'], parents: ['system'] },
  { id: 'outer', displayName: 'Outer Planets', children: ['jupiter', 'saturn'], parents: ['system'] },
  { id: 'mercury', displayName: 'Mercury', children: [], parents: ['inner'] },
  { id: 'venus', displayName: 'Venus', children: [], parents: ['inner'] },
  { id: 'earth', displayName: 'Earth', children: [], parents: ['inner'] },
  { id: 'mars', displayName: 'Mars', children: [], parents: ['inner'] },
  { id: 'jupiter', displayName: 'Jupiter', children: [], parents: ['outer'] },
  { id: 'saturn', displayName: 'Saturn', children: [], parents: ['outer'] },
]);

export interface ExampleDef {
  name: string;
  mount: (container: HTMLElement) => OlliHandle;
}

export const examples: ExampleDef[] = [
  {
    name: 'Bar Chart',
    mount: (c) => olliVis(barChartSpec, c, { initialPreset: 'medium' }),
  },
  {
    name: 'Line Chart',
    mount: (c) => olliVis(lineChartSpec, c, { initialPreset: 'medium' }),
  },
  {
    name: 'Pulley Diagram',
    mount: (c) => olliDiagram(pulleySpec, c),
  },
  {
    name: 'Raw Hypergraph',
    mount: (c) => olli(rawGraph, c),
  },
];
