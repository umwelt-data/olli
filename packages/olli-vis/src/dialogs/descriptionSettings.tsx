import type { DialogContribution } from 'olli-core';
import { descriptionSettingsDialog as sharedDialog } from 'olli-render-solid';
import type { VisPayload, OlliNodeType } from '../spec/types.js';

const ALL_ROLES: OlliNodeType[] = [
  'root', 'view', 'xAxis', 'yAxis', 'legend', 'guide', 'filteredData', 'annotations', 'other',
];

const ROLE_LABELS: Record<OlliNodeType, string> = {
  root: 'Chart overview',
  view: 'Sub-chart',
  xAxis: 'X Axis',
  yAxis: 'Y Axis',
  legend: 'Legend',
  guide: 'Guide',
  filteredData: 'Data group',
  annotations: 'Annotations',
  other: 'Other elements',
};

const TOKEN_LABELS: Record<string, string> = {
  visType: 'Type',
  visData: 'Data range',
  visSize: 'Size',
  aggregate: 'Aggregate stats',
  quartile: 'Quartile',
  instructions: 'Instructions',
};

const TOKEN_DESCRIPTIONS: Record<string, string> = {
  visType: 'What kind of chart or scale',
  visData: 'The range of data values',
  visSize: 'Number of data points or items',
  aggregate: 'Summary statistics like average, min, max',
  quartile: 'How this group compares to its siblings',
  instructions: 'Available keyboard actions',
};

export function descriptionSettingsDialog(): DialogContribution<VisPayload> {
  return sharedDialog<VisPayload>({
    roles: ALL_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
    tokenLabels: TOKEN_LABELS,
    tokenDescriptions: TOKEN_DESCRIPTIONS,
    roleForNode: (runtime, navNode) => {
      const edge = navNode.hyperedgeId
        ? runtime.hypergraph().edges.get(navNode.hyperedgeId)
        : undefined;
      return (edge?.payload?.nodeType as string) ?? 'root';
    },
  });
}
