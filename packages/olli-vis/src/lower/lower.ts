import type { Hyperedge, Hypergraph } from 'olli-core';
import { buildHypergraph, selectionTest } from 'olli-core';
import type { FieldPredicate, LogicalAnd } from 'olli-core';
import type {
  OlliNode,
  OlliNodeType,
  OlliVisSpec,
  UnitOlliVisSpec,
  VisPayload,
} from '../spec/types.js';
import { isMultiSpec } from '../spec/types.js';
import { elaborateSpec } from '../spec/elaborate.js';
import { fieldToPredicates, getFieldDef } from '../util/data.js';
import { fmtValue, pluralize } from '../util/values.js';
import { predicateToDescription } from './describe.js';

let counter = 0;
function nextId(): string {
  return String(counter++);
}

export function lowerVisSpec(rawSpec: OlliVisSpec): Hypergraph<VisPayload> {
  counter = 0;
  const spec = elaborateSpec(rawSpec);
  const edges: Hyperedge<VisPayload>[] = [];

  if (isMultiSpec(spec)) {
    const rootId = nextId();
    const viewIds: string[] = [];

    for (let i = 0; i < spec.units.length; i++) {
      const unit = spec.units[i]!;
      const viewId = nextId();
      viewIds.push(viewId);
      const childIds = lowerUnit(unit, i, viewId, edges);
      const viewDisplayName = unit.title ?? `View ${i + 1}`;
      edges.push({
        id: viewId,
        displayName: viewDisplayName,
        role: 'view',
        children: childIds,
        parents: [rootId],
        payload: {
          nodeType: 'view',
          specIndex: i,
          viewType: spec.operator,
          spec: unit,
        },
      });
    }

    const label = spec.units[0]?.description || spec.units[0]?.title || 'Chart';
    edges.push({
      id: rootId,
      displayName: label,
      role: 'root',
      children: viewIds,
      parents: [],
      payload: { nodeType: 'root', spec: spec.units[0]! },
    });
  } else {
    const rootId = nextId();
    const nodes = Array.isArray(spec.structure) ? spec.structure : spec.structure ? [spec.structure] : [];

    if (nodes.length === 1 && 'groupby' in nodes[0]! && nodes[0]!.groupby === spec.facet) {
      // faceted: root = groupby node
      const childIds = lowerGroupby(spec, undefined, rootId, nodes[0]!, edges);
      const label = spec.description || spec.title || 'Chart';
      edges.push({
        id: rootId,
        displayName: label,
        role: 'root',
        children: childIds,
        parents: [],
        payload: {
          nodeType: 'root',
          groupby: nodes[0]!.groupby,
          spec,
        },
      });
    } else {
      const childIds = lowerUnit(spec, undefined, rootId, edges);
      if (childIds.length === 1 && edges.find((e) => e.id === childIds[0])?.role !== 'filteredData') {
        // single axis/groupby as root — collapse
        const child = edges.find((e) => e.id === childIds[0])!;
        child.parents = [];
        // root replaces; re-id
        const label = spec.description || spec.title || spec.mark ? `${spec.mark} chart` : 'Chart';
        child.displayName = label;
        child.role = 'root';
        if (child.payload) child.payload.nodeType = 'root';
        // remove rootId since it's collapsed
      } else {
        const label = spec.description || spec.title || (spec.mark ? `${spec.mark} chart` : 'Dataset');
        edges.push({
          id: rootId,
          displayName: label,
          role: 'root',
          children: childIds,
          parents: [],
          payload: { nodeType: 'root', spec },
        });
      }
    }
  }

  return buildHypergraph(edges);
}

function lowerUnit(
  spec: UnitOlliVisSpec,
  specIndex: number | undefined,
  parentId: string,
  edges: Hyperedge<VisPayload>[],
): string[] {
  const data = spec.selection ? selectionTest(spec.data, spec.selection) : spec.data;
  const nodes = Array.isArray(spec.structure)
    ? spec.structure
    : spec.structure
      ? [spec.structure]
      : [];
  return lowerNodes(spec, specIndex, parentId, nodes, data, edges);
}

function lowerNodes(
  spec: UnitOlliVisSpec,
  specIndex: number | undefined,
  parentId: string,
  nodes: OlliNode[],
  data: import('../spec/types.js').OlliDataset,
  edges: Hyperedge<VisPayload>[],
): string[] {
  const childIds: string[] = [];
  for (const node of nodes) {
    if ('groupby' in node) {
      const id = nextId();
      const subIds = lowerGroupby(spec, specIndex, id, node, edges);
      const nodeType = nodeTypeFromGroupField(node.groupby, spec);
      const guide =
        spec.axes?.find((a) => a.field === node.groupby) ??
        spec.legends?.find((l) => l.field === node.groupby) ??
        spec.guides?.find((g) => g.field === node.groupby);
      const fd = getFieldDef(node.groupby, spec.fields ?? []);
      const guideLabel =
        nodeType === 'xAxis' ? 'x-axis' :
        nodeType === 'yAxis' ? 'y-axis' :
        nodeType === 'legend' ? 'legend' :
        guide?.channel ?? 'guide';
      const label = guide?.title ?? fd.label ?? fd.field;
      const displayName = `${guideLabel} titled ${label}`;
      edges.push({
        id,
        displayName,
        role: nodeType,
        children: subIds,
        parents: [parentId],
        payload: {
          nodeType,
          groupby: node.groupby,
          specIndex,
          spec,
        },
      });
      childIds.push(id);
    } else if ('predicate' in node) {
      const id = nextId();
      const pred = node.predicate;
      const displayName = node.name ?? predicateToDescription(pred, spec.fields ?? []);
      const subData = data; // child nodes inherit data context
      const subIds = lowerNodes(spec, specIndex, id, node.children ?? [], subData, edges);
      edges.push({
        id,
        displayName,
        role: 'filteredData',
        children: subIds,
        parents: [parentId],
        payload: {
          nodeType: 'filteredData',
          predicate: pred as FieldPredicate,
          specIndex,
          spec,
        },
      });
      childIds.push(id);
    } else if ('annotations' in node) {
      const id = nextId();
      const subIds = lowerNodes(spec, specIndex, id, node.annotations, data, edges);
      edges.push({
        id,
        displayName: 'Data highlights',
        role: 'annotations',
        children: subIds,
        parents: [parentId],
        payload: { nodeType: 'annotations', specIndex, spec },
      });
      childIds.push(id);
    }
  }
  return childIds;
}

function lowerGroupby(
  spec: UnitOlliVisSpec,
  specIndex: number | undefined,
  parentId: string,
  node: import('../spec/types.js').OlliGroupNode,
  edges: Hyperedge<VisPayload>[],
): string[] {
  const data = spec.selection ? selectionTest(spec.data, spec.selection) : spec.data;
  const axis = spec.axes?.find((a) => a.field === node.groupby);
  const childPreds = fieldToPredicates(node.groupby, data, spec.fields ?? [], axis?.ticks);
  const nodeType = nodeTypeFromGroupField(node.groupby, spec);
  const fd = getFieldDef(node.groupby, spec.fields ?? []);
  const childIds: string[] = [];

  for (const pred of childPreds) {
    const id = nextId();
    const displayName = predicateDisplayName(pred, fd);
    const childNodeType: OlliNodeType = nodeType === 'root' ? 'view' : 'filteredData';
    const viewType = nodeType === 'root' ? ('facet' as const) : undefined;

    const subIds = lowerNodes(spec, specIndex, id, node.children ?? [], data, edges);

    edges.push({
      id,
      displayName,
      role: childNodeType,
      children: subIds,
      parents: [parentId],
      payload: {
        nodeType: childNodeType,
        predicate: pred,
        specIndex,
        viewType,
        spec,
      },
    });
    childIds.push(id);
  }
  return childIds;
}

function nodeTypeFromGroupField(field: string, spec: UnitOlliVisSpec): OlliNodeType {
  if (field === spec.facet) return 'root';
  const axis = spec.axes?.find((a) => a.field === field);
  if (axis) return axis.axisType === 'x' ? 'xAxis' : 'yAxis';
  if (spec.legends?.find((l) => l.field === field)) return 'legend';
  if (spec.guides?.find((g) => g.field === field)) return 'guide';
  return 'other';
}

function predicateDisplayName(
  pred: FieldPredicate,
  fd: import('../spec/types.js').OlliFieldDef,
): string {
  if ('equal' in pred) {
    return fmtValue(pred.equal as import('../spec/types.js').OlliValue, fd);
  }
  if ('range' in pred) {
    const [lo, hi] = pred.range as [number, number];
    return `${fmtValue(lo, fd)} to ${fmtValue(hi, fd)}`;
  }
  return predicateToDescription(pred, [fd]);
}
