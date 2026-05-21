import type {
  DiagramSpec,
  DiagramElement,
  DiagramRelation,
  ConnectionRelation,
  AlignmentRelation,
  DistributionRelation,
  GroupingRelation,
} from 'olli-diagram';
import type { DiagramAdapter } from './types.js';

// === Types ===

export interface OlliCustomData {
  kind?: string;
  /** Short display name — overrides the Bluefish element name or text content. */
  label?: string;
  /** Explanatory text — what the element does or represents. Appended after label in screen reader output. */
  description?: string;
  semantic?: string;
  directed?: boolean;
  skip?: boolean;
}

function getOlliMeta(node: RecordedNode): OlliCustomData {
  const cd = node.props.customData;
  if (cd && typeof cd === 'object' && 'olli' in (cd as object))
    return (cd as { olli: OlliCustomData }).olli;
  return {};
}

interface RecordedNode {
  _recorded: true;
  type: string;
  props: Record<string, unknown>;
  children: (RecordedNode | string)[];
}

type BfComponent = (propsOrChildren?: unknown, children?: unknown) => unknown;

export interface BluefishKit {
  Align: BfComponent;
  Arrow: BfComponent;
  Circle: BfComponent;
  Distribute: BfComponent;
  Group: BfComponent;
  Image: BfComponent;
  Line: BfComponent;
  Path: BfComponent;
  Rect: BfComponent;
  Ref: BfComponent;
  StackH: BfComponent;
  StackV: BfComponent;
  Text: BfComponent;
}

// === Recorder ===

function makeRecorder(type: string): BfComponent {
  return (propsOrChildren?: unknown, maybeChildren?: unknown): RecordedNode => {
    let props: Record<string, unknown> = {};
    let children: unknown[] = [];

    if (Array.isArray(propsOrChildren)) {
      children = propsOrChildren;
    } else if (
      propsOrChildren != null &&
      typeof propsOrChildren === 'object' &&
      !(propsOrChildren as RecordedNode)._recorded
    ) {
      props = propsOrChildren as Record<string, unknown>;
      if (Array.isArray(maybeChildren)) children = maybeChildren;
      else if (maybeChildren != null) children = [maybeChildren];
    } else if (propsOrChildren != null) {
      children = [propsOrChildren];
    }

    return {
      _recorded: true,
      type,
      props,
      children: children.map(c =>
        typeof c === 'string' || typeof c === 'number' ? String(c) : (c as RecordedNode),
      ),
    };
  };
}

function createBluefishRecorder(): BluefishKit {
  const types: (keyof BluefishKit)[] = [
    'Align', 'Arrow', 'Circle', 'Distribute', 'Group', 'Image',
    'Line', 'Path', 'Rect', 'Ref', 'StackH', 'StackV', 'Text',
  ];
  return Object.fromEntries(types.map(t => [t, makeRecorder(t)])) as unknown as BluefishKit;
}

// === Inference helpers ===

const PRIMITIVES = new Set(['Circle', 'Rect', 'Path', 'Image']);

function inferAlignmentAxis(alignment: unknown): 'horizontal' | 'vertical' | 'both' {
  switch (alignment) {
    case 'center': return 'both';
    case 'centerX':
    case 'left':
    case 'right': return 'vertical';
    case 'centerY':
    case 'top':
    case 'bottom': return 'horizontal';
    default: return 'both';
  }
}

function generateId(type: string, members: string[], counters: Map<string, number>): string {
  const base = `${type.toLowerCase()}-${members.join('-')}`;
  const count = counters.get(base) ?? 0;
  counters.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

function isCopyName(name: string): boolean {
  return name.endsWith('copy');
}

function recordedChildren(node: RecordedNode): RecordedNode[] {
  return node.children.filter((c): c is RecordedNode => typeof c !== 'string');
}

function stringChildren(node: RecordedNode): string[] {
  return node.children.filter((c): c is string => typeof c === 'string');
}

// === Tree walking ===

function extractElementFromInline(
  node: RecordedNode,
  elements: Map<string, DiagramElement>,
): void {
  const name = node.props.name as string | undefined;
  if (!name || isCopyName(name)) return;
  if (elements.has(name)) return;
  const olli = getOlliMeta(node);
  if (olli.skip) return;

  const el: DiagramElement = node.type === 'Text'
    ? { id: name, label: olli.label ?? stringChildren(node)[0] ?? name, kind: olli.kind ?? 'text' }
    : { id: name, label: olli.label ?? name, kind: olli.kind ?? node.type.toLowerCase() };
  if (olli.description) el.description = olli.description;
  elements.set(name, el);
}

const LAYOUT_TYPES = new Set(['Align', 'Distribute', 'StackH', 'StackV']);

function processNode(
  node: RecordedNode,
  elements: Map<string, DiagramElement>,
  relations: DiagramRelation[],
  idCounters: Map<string, number>,
): void {
  const name = node.props.name as string | undefined;
  const type = node.type;
  const olli = getOlliMeta(node);

  // Skip copy elements entirely
  if (name && isCopyName(name)) return;

  const kids = recordedChildren(node);
  const refKids = kids.filter(c => c.type === 'Ref');
  const inlineKids = kids.filter(c => c.type !== 'Ref');

  // Named primitive → element, no recursion needed
  if (PRIMITIVES.has(type) && name) {
    if (olli.skip) {
      return;
    }
    if (!elements.has(name)) {
      const el: DiagramElement = { id: name, label: olli.label ?? name, kind: olli.kind ?? type.toLowerCase() };
      if (olli.description) el.description = olli.description;
      elements.set(name, el);
    }
    return;
  }

  // Named Text → element with string child as label
  if (type === 'Text' && name) {
    if (olli.skip) {
      return;
    }
    if (!elements.has(name)) {
      const label = olli.label ?? stringChildren(node)[0] ?? name;
      const el: DiagramElement = { id: name, label, kind: olli.kind ?? 'text' };
      if (olli.description) el.description = olli.description;
      elements.set(name, el);
    }
    return;
  }

  const isLine = type === 'Line';
  const isArrow = type === 'Arrow';

  // Named Line/Arrow → connector element + two endpoint connections
  if ((isLine || isArrow) && name) {
    if (olli.skip) return;
    if (!elements.has(name)) {
      elements.set(name, { id: name, label: olli.label ?? name, kind: olli.kind ?? (isLine ? 'line' : 'arrow'), connector: true });
    }
    if (refKids.length >= 2) {
      const ep0 = refKids[0]!.props.select as string;
      const ep1 = refKids[1]!.props.select as string;
      if (!isCopyName(ep0) && !isCopyName(ep1)) {
        const conn0: ConnectionRelation = {
          kind: 'connection',
          id: generateId('connection', [ep0, name], idCounters),
          endpoints: [ep0, name],
        };
        if (olli.directed ?? isArrow) conn0.directed = true;
        if (olli.semantic) conn0.semantic = olli.semantic;
        relations.push(conn0);

        const conn1: ConnectionRelation = {
          kind: 'connection',
          id: generateId('connection', [name, ep1], idCounters),
          endpoints: [name, ep1],
        };
        if (olli.directed ?? isArrow) conn1.directed = true;
        if (olli.semantic) conn1.semantic = olli.semantic;
        relations.push(conn1);
      }
    }
    return;
  }

  // Unnamed Line/Arrow with ref children → connection with auto id
  if ((isLine || isArrow) && refKids.length >= 2) {
    if (olli.skip) return;
    const ep0 = refKids[0]!.props.select as string;
    const ep1 = refKids[1]!.props.select as string;
    if (!isCopyName(ep0) && !isCopyName(ep1)) {
      const id = generateId(type, [ep0, ep1], idCounters);
      const conn: ConnectionRelation = {
        kind: 'connection',
        id,
        endpoints: [ep0, ep1],
      };
      if (olli.directed ?? isArrow) conn.directed = true;
      if (olli.semantic) conn.semantic = olli.semantic;
      relations.push(conn);
    }
    return;
  }

  // Named composite with only inline children (no Refs) → single element, don't recurse
  if (name && refKids.length === 0 && inlineKids.length > 0) {
    if (olli.skip) return;
    if (!elements.has(name)) {
      const el: DiagramElement = { id: name, label: olli.label ?? name, kind: olli.kind ?? type.toLowerCase() };
      if (olli.description) el.description = olli.description;
      elements.set(name, el);
    }
    return;
  }

  // Relational node: has Ref children, or unnamed with mixed children
  const memberIds: string[] = [];

  for (const ref of refKids) {
    const select = ref.props.select as string;
    if (!isCopyName(select)) memberIds.push(select);
  }

  for (const inlineChild of inlineKids) {
    const childName = inlineChild.props.name as string | undefined;
    const childOlli = getOlliMeta(inlineChild);
    if (childName && !isCopyName(childName)) {
      if (!childOlli.skip) {
        extractElementFromInline(inlineChild, elements);
        memberIds.push(childName);
      }
    } else if (!childName) {
      processNode(inlineChild, elements, relations, idCounters);
    }
  }

  if (memberIds.length < 2) return;

  const relId = name ?? generateId(type, memberIds, idCounters);
  const hasOlliMeta = Object.keys(olli).length > 0;

  if (type === 'Group') {
    const rel: GroupingRelation = { kind: 'grouping', id: relId, members: memberIds };
    if (olli.label) rel.label = olli.label;
    if (olli.description) rel.description = olli.description;
    relations.push(rel);
  } else if (LAYOUT_TYPES.has(type)) {
    // Layout relations are suppressed unless the author opts in via customData.olli
    if (!hasOlliMeta) return;
    if (type === 'Align') {
      const rel: AlignmentRelation = {
        kind: 'alignment',
        id: relId,
        members: memberIds,
        axis: inferAlignmentAxis(node.props.alignment),
      };
      if (olli.label) rel.label = olli.label;
      relations.push(rel);
    } else {
      const rel: DistributionRelation = {
        kind: 'distribution',
        id: relId,
        members: memberIds,
        direction: type === 'StackV' ? 'vertical'
          : type === 'StackH' ? 'horizontal'
          : (node.props.direction as 'horizontal' | 'vertical') ?? 'horizontal',
      };
      if (olli.label) rel.label = olli.label;
      relations.push(rel);
    }
  }
}

function filterToElementMembers(
  rel: DiagramRelation,
  elementIds: Set<string>,
): DiagramRelation | null {
  if (rel.kind === 'connection') {
    const [ep0, ep1] = rel.endpoints;
    return elementIds.has(ep0) && elementIds.has(ep1) ? rel : null;
  }
  if (rel.kind === 'containment') {
    const contents = rel.contents.filter(id => elementIds.has(id));
    return elementIds.has(rel.container) && contents.length > 0
      ? { ...rel, contents }
      : null;
  }
  const members = rel.members.filter(id => elementIds.has(id));
  return members.length >= 2 ? { ...rel, members } : null;
}

function walkTree(nodes: RecordedNode[]): DiagramSpec {
  const elements = new Map<string, DiagramElement>();
  let relations: DiagramRelation[] = [];
  const idCounters = new Map<string, number>();

  for (const node of nodes) {
    processNode(node, elements, relations, idCounters);
  }

  // Suppress connections where both endpoints share a structural group
  const groupMembership = new Map<string, Set<string>>();
  for (const rel of relations) {
    if (rel.kind === 'grouping') {
      for (const m of rel.members) {
        if (!groupMembership.has(m)) groupMembership.set(m, new Set());
        groupMembership.get(m)!.add(rel.id);
      }
    }
  }
  relations = relations.filter(rel => {
    if (rel.kind !== 'connection') return true;
    const [a, b] = rel.endpoints;
    const groupsA = groupMembership.get(a);
    const groupsB = groupMembership.get(b);
    if (!groupsA || !groupsB) return true;
    for (const g of groupsA) {
      if (groupsB.has(g)) return false;
    }
    return true;
  });

  const elementIds = new Set(elements.keys());
  const filteredRelations = relations
    .map(rel => filterToElementMembers(rel, elementIds))
    .filter((rel): rel is DiagramRelation => rel !== null);

  return {
    elements: [...elements.values()],
    relations: filteredRelations,
  };
}

// === Public API ===

export type BluefishSpecFn = (kit: BluefishKit) => unknown[];

export const BluefishAdapter: DiagramAdapter<BluefishSpecFn> = specFn => {
  const recorder = createBluefishRecorder();
  const tree = specFn(recorder) as RecordedNode[];
  return walkTree(tree);
};
