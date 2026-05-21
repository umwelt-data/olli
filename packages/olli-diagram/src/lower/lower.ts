import type { Hyperedge, Hypergraph } from 'olli-core';
import { buildHypergraph } from 'olli-core';
import type {
  DiagramElement,
  DiagramPayload,
  DiagramRelation,
  DiagramSpec,
} from '../spec/types.js';

const STRUCTURAL_KINDS = new Set(['grouping', 'containment']);

function isStructural(rel: DiagramRelation): boolean {
  return STRUCTURAL_KINDS.has(rel.kind);
}

export function lowerDiagramSpec(spec: DiagramSpec): Hypergraph<DiagramPayload> {
  const elementsById = new Map<string, DiagramElement>();
  for (const el of spec.elements) {
    elementsById.set(el.id, el);
  }

  // structural membership: elementId → structural relation IDs containing it
  const structuralMembership = new Map<string, string[]>();
  for (const rel of spec.relations) {
    if (!isStructural(rel)) continue;
    for (const id of getMemberIds(rel)) {
      let list = structuralMembership.get(id);
      if (!list) { list = []; structuralMembership.set(id, list); }
      list.push(rel.id);
    }
  }

  // referential membership: elementId → referential relation IDs containing it
  const referentialMembership = new Map<string, string[]>();
  for (const rel of spec.relations) {
    if (isStructural(rel)) continue;
    for (const id of getMemberIds(rel)) {
      let list = referentialMembership.get(id);
      if (!list) { list = []; referentialMembership.set(id, list); }
      list.push(rel.id);
    }
  }

  const edges: Hyperedge<DiagramPayload>[] = [];

  for (const rel of spec.relations) {
    const memberIds = getMemberIds(rel);
    const children = memberIds;
    const parents = isStructural(rel) ? ['root'] : [];

    const edge: Hyperedge<DiagramPayload> = {
      id: rel.id,
      displayName: generateDisplayName(rel, elementsById),
      role: rel.kind,
      children,
      parents,
      payload: { sourceRelation: rel },
      ...(!isStructural(rel) && { contextOnly: true }),
    };
    edges.push(edge);
  }

  const orphanIds: string[] = [];

  for (const el of spec.elements) {
    const sp = structuralMembership.get(el.id) ?? [];
    const rp = referentialMembership.get(el.id) ?? [];
    const isOrphan = sp.length === 0;
    const isConnector = el.connector === true;
    const parents = isOrphan
      ? (isConnector ? [...rp] : ['root', ...rp])
      : [...sp, ...rp];

    const edge: Hyperedge<DiagramPayload> = {
      id: el.id,
      displayName: el.label,
      role: 'element',
      children: [],
      parents,
      payload: { sourceElement: el },
    };
    edges.push(edge);

    if (isOrphan && !isConnector) orphanIds.push(el.id);
  }

  const rootChildren = [
    ...spec.relations.filter(r => isStructural(r)).map(r => r.id),
    ...orphanIds,
  ];

  const root: Hyperedge<DiagramPayload> = {
    id: 'root',
    displayName: spec.title ?? 'Diagram',
    children: rootChildren,
    parents: [],
  };
  if (spec.description) root.description = spec.description;

  edges.unshift(root);

  return buildHypergraph(edges);
}

function getMemberIds(relation: DiagramRelation): string[] {
  switch (relation.kind) {
    case 'connection':
      return [...relation.endpoints];
    case 'containment':
      return [relation.container, ...relation.contents];
    case 'alignment':
    case 'distribution':
    case 'grouping':
      return [...relation.members];
  }
}

function generateDisplayName(
  relation: DiagramRelation,
  elementsById: Map<string, DiagramElement>,
): string {
  if (relation.label) return relation.label;

  const labelOf = (id: string) => elementsById.get(id)?.label ?? id;

  switch (relation.kind) {
    case 'connection': {
      const e0 = labelOf(relation.endpoints[0]);
      const e1 = labelOf(relation.endpoints[1]);
      if (relation.semantic) {
        const verb = relation.semantic.replace(/-/g, ' ');
        return `${e0} ${verb} ${e1}`;
      }
      if (relation.directed) {
        return `${e0} connects to ${e1}`;
      }
      return `Connection: ${e0} and ${e1}`;
    }
    case 'containment': {
      const container = labelOf(relation.container);
      return `${container} contains ${relation.contents.length} items`;
    }
    case 'grouping': {
      const labels = relation.members.map(labelOf);
      return `Group of ${labels.length}: ${labels.join(', ')}`;
    }
    case 'alignment': {
      const labels = relation.members.map(labelOf);
      return `Aligned ${relation.axis}: ${labels.join(', ')}`;
    }
    case 'distribution': {
      const labels = relation.members.map(labelOf);
      return `Distributed ${relation.direction}: ${labels.join(', ')}`;
    }
  }
}
