import type { DialogContribution } from 'olli-core';
import { descriptionSettingsDialog as sharedDialog } from 'olli-render-solid';
import type { DiagramPayload } from '../spec/types.js';

const DIAGRAM_ROLES = [
  { value: 'root', label: 'Diagram overview' },
  { value: 'element', label: 'Element' },
  { value: 'connection', label: 'Connection' },
  { value: 'containment', label: 'Containment' },
  { value: 'alignment', label: 'Alignment' },
  { value: 'distribution', label: 'Distribution' },
  { value: 'grouping', label: 'Grouping' },
] as const;

const TOKEN_LABELS: Record<string, string> = {
  elementKind: 'Element Kind',
};

const TOKEN_DESCRIPTIONS: Record<string, string> = {
  elementKind: 'The type of diagram element (e.g., pulley, box, rope)',
};

export function descriptionSettingsDialog(): DialogContribution<DiagramPayload> {
  return sharedDialog<DiagramPayload>({
    roles: DIAGRAM_ROLES,
    tokenLabels: TOKEN_LABELS,
    tokenDescriptions: TOKEN_DESCRIPTIONS,
    roleForNode: (runtime, navNode) => {
      const edge = navNode.hyperedgeId
        ? runtime.hypergraph().edges.get(navNode.hyperedgeId)
        : undefined;
      return edge?.role ?? 'root';
    },
  });
}
