import type { HyperedgeId, Hypergraph } from '../hypergraph/types.js';

export type NavNodeId = string;

export type NavNodeKind = 'real' | 'virtualParentContext';

export interface NavNode {
  navId: NavNodeId;
  kind: NavNodeKind;
  hyperedgeId: HyperedgeId | null;
  path: readonly HyperedgeId[];
  parentNavId: NavNodeId | null;
  childNavIds: NavNodeId[];
}

export interface NavTree {
  roots: readonly NavNodeId[];
  byNavId: ReadonlyMap<NavNodeId, NavNode>;
  /** Reverse index: for each hyperedge, the NavNodeIds where it appears. Ordered by nav-tree walk order. */
  hyperedgeToNavIds: ReadonlyMap<HyperedgeId, readonly NavNodeId[]>;
}

export const VIRTUAL_SUFFIX = '/^';

export function buildNavTree<P>(graph: Hypergraph<P>): NavTree {
  const byNavId = new Map<NavNodeId, NavNode>();
  const hyperedgeToNavIds = new Map<HyperedgeId, NavNodeId[]>();
  const rootIds: NavNodeId[] = [];

  for (const rootEdgeId of graph.roots) {
    const rootNavId = rootEdgeId;
    const rootNode: NavNode = {
      navId: rootNavId,
      kind: 'real',
      hyperedgeId: rootEdgeId,
      path: [rootEdgeId],
      parentNavId: null,
      childNavIds: [],
    };
    byNavId.set(rootNavId, rootNode);
    indexNode(hyperedgeToNavIds, rootEdgeId, rootNavId);
    rootIds.push(rootNavId);
    expandChildren(rootNode, graph, byNavId, hyperedgeToNavIds);
  }

  return { roots: rootIds, byNavId, hyperedgeToNavIds };
}

function expandChildren<P>(
  parentNav: NavNode,
  graph: Hypergraph<P>,
  byNavId: Map<NavNodeId, NavNode>,
  hyperedgeToNavIds: Map<HyperedgeId, NavNodeId[]>,
): void {
  if (parentNav.hyperedgeId === null) return;
  const edge = graph.edges.get(parentNav.hyperedgeId);
  if (!edge) return;
  for (const childEdgeId of edge.children) {
    const childPath: HyperedgeId[] = [...parentNav.path, childEdgeId];
    const childNavId = childPath.join('/');
    const childNode: NavNode = {
      navId: childNavId,
      kind: 'real',
      hyperedgeId: childEdgeId,
      path: childPath,
      parentNavId: parentNav.navId,
      childNavIds: [],
    };
    byNavId.set(childNavId, childNode);
    indexNode(hyperedgeToNavIds, childEdgeId, childNavId);
    parentNav.childNavIds.push(childNavId);
    expandChildren(childNode, graph, byNavId, hyperedgeToNavIds);
  }
}

function indexNode(
  map: Map<HyperedgeId, NavNodeId[]>,
  edgeId: HyperedgeId,
  navId: NavNodeId,
): void {
  const list = map.get(edgeId);
  if (list) list.push(navId);
  else map.set(edgeId, [navId]);
}

export function isVirtualNavId(navId: NavNodeId): boolean {
  return navId.endsWith(VIRTUAL_SUFFIX);
}

export function sourceNavIdOfVirtual(navId: NavNodeId): NavNodeId {
  return navId.slice(0, -VIRTUAL_SUFFIX.length);
}
