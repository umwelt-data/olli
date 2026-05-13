import type { DialogContribution } from 'olli-core';
import { descriptionSettingsDialog as sharedDialog } from 'olli-render-solid';
import type { VisPayload, OlliNodeType } from '../spec/types.js';

const ALL_ROLES: OlliNodeType[] = [
  'root', 'view', 'xAxis', 'yAxis', 'legend', 'guide', 'filteredData', 'annotations', 'other',
];

const ROLE_LABELS: Record<OlliNodeType, string> = {
  root: 'Root',
  view: 'View',
  xAxis: 'X Axis',
  yAxis: 'Y Axis',
  legend: 'Legend',
  guide: 'Guide',
  filteredData: 'Filtered Data',
  annotations: 'Annotations',
  other: 'Other',
};

const TOKEN_LABELS: Record<string, string> = {
  visName: 'Name',
  visType: 'Type',
  visChildren: 'Children',
  visData: 'Data range',
  visSize: 'Size',
  aggregate: 'Aggregate stats',
  quartile: 'Quartile',
  visParent: 'Parent context',
  instructions: 'Instructions',
};

export function descriptionSettingsDialog(): DialogContribution<VisPayload> {
  return sharedDialog<VisPayload>({
    roles: ALL_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
    tokenLabels: TOKEN_LABELS,
    roleForNode: (runtime, navNode) => {
      const edge = navNode.hyperedgeId
        ? runtime.hypergraph().edges.get(navNode.hyperedgeId)
        : undefined;
      return (edge?.payload?.nodeType as string) ?? 'root';
    },
  });
}
