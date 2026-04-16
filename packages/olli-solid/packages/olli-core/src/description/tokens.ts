import type { Hyperedge, Hypergraph } from '../hypergraph/types.js';
import type { Selection } from '../predicate/types.js';
import type { NavNode } from '../runtime/navtree.js';
import type { NavigationRuntime } from '../runtime/runtime.js';

export type TokenName = string;

export interface TokenValue {
  short: string;
  long: string;
}

export interface TokenContext<P> {
  navNode: NavNode;
  edge: Hyperedge<P> | null;
  hypergraph: Hypergraph<P>;
  runtime: NavigationRuntime<P>;
  selection: Selection;
  fullPredicate: Selection;
}

export interface DescriptionToken<P = unknown> {
  name: TokenName;
  applicableRoles: readonly string[] | '*';
  compute: (ctx: TokenContext<P>) => TokenValue;
}

export interface TokenRegistry<P> {
  register(token: DescriptionToken<P>): void;
  byName(name: TokenName): DescriptionToken<P> | undefined;
  all(): readonly DescriptionToken<P>[];
  applicableTo(role: string): readonly DescriptionToken<P>[];
}

export const VIRTUAL_ROLE = '__virtualParentContext__';

export function isTokenApplicable<P>(token: DescriptionToken<P>, role: string): boolean {
  if (token.applicableRoles === '*') return true;
  return token.applicableRoles.includes(role);
}

export function createTokenRegistry<P>(): TokenRegistry<P> {
  const byName = new Map<TokenName, DescriptionToken<P>>();
  return {
    register(token) {
      byName.set(token.name, token);
    },
    byName(name) {
      return byName.get(name);
    },
    all() {
      return [...byName.values()];
    },
    applicableTo(role) {
      return this.all().filter((t) => isTokenApplicable(t, role));
    },
  };
}

// ---- built-in generic tokens ----

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

export function nameToken<P>(): DescriptionToken<P> {
  return {
    name: 'name',
    applicableRoles: '*',
    compute: ({ navNode, edge }) => {
      if (navNode.kind === 'virtualParentContext') {
        return { short: 'Parent contexts', long: 'Parent contexts' };
      }
      if (!edge) return { short: '', long: '' };
      const short = edge.displayName;
      const long = edge.description ? `${edge.displayName}. ${edge.description}` : short;
      return { short, long };
    },
  };
}

export function indexToken<P>(): DescriptionToken<P> {
  return {
    name: 'index',
    applicableRoles: '*',
    compute: ({ navNode, runtime }) => {
      if (!navNode.parentNavId) return { short: '', long: '' };
      const parent = runtime.getNavNode(navNode.parentNavId);
      if (!parent) return { short: '', long: '' };
      const idx = parent.childNavIds.indexOf(navNode.navId);
      if (idx < 0) return { short: '', long: '' };
      const total = parent.childNavIds.length;
      return {
        short: `${idx + 1} of ${total}`,
        long: `item ${idx + 1} of ${total}`,
      };
    },
  };
}

export function levelToken<P>(): DescriptionToken<P> {
  return {
    name: 'level',
    applicableRoles: '*',
    compute: ({ navNode }) => {
      const depth = navNode.path.length;
      return { short: `level ${depth}`, long: `depth level ${depth}` };
    },
  };
}

export function parentToken<P>(): DescriptionToken<P> {
  return {
    name: 'parent',
    applicableRoles: '*',
    compute: ({ navNode, runtime, hypergraph }) => {
      if (!navNode.parentNavId) return { short: '', long: '' };
      const parent = runtime.getNavNode(navNode.parentNavId);
      if (!parent || parent.hyperedgeId === null) return { short: '', long: '' };
      const parentEdge = hypergraph.edges.get(parent.hyperedgeId);
      const name = parentEdge?.displayName ?? '';
      return { short: name, long: `parent: ${name}` };
    },
  };
}

export function childrenToken<P>(): DescriptionToken<P> {
  return {
    name: 'children',
    applicableRoles: '*',
    compute: ({ navNode, runtime, hypergraph }) => {
      const count = navNode.childNavIds.length;
      if (count === 0) return { short: '', long: '' };
      const short = `${count} ${plural(count, 'child', 'children')}`;
      const names = navNode.childNavIds
        .map((id) => runtime.getNavNode(id))
        .map((n) => (n && n.hyperedgeId ? hypergraph.edges.get(n.hyperedgeId)?.displayName : undefined))
        .filter((s): s is string => !!s);
      const long = names.length > 0 ? `${short}: ${names.join(', ')}` : short;
      return { short, long };
    },
  };
}

export function parentContextsToken<P>(): DescriptionToken<P> {
  return {
    name: 'parentContexts',
    applicableRoles: [VIRTUAL_ROLE],
    compute: ({ navNode, runtime, hypergraph }) => {
      if (navNode.kind !== 'virtualParentContext') return { short: '', long: '' };
      const sourceEdgeId = navNode.path[navNode.path.length - 1];
      const sourceName = sourceEdgeId
        ? hypergraph.edges.get(sourceEdgeId)?.displayName ?? ''
        : '';

      const cursor = runtime.virtualCursor(navNode.navId);
      const optNames = navNode.childNavIds.map((id) => {
        const node = runtime.getNavNode(id);
        const edgeId = node?.hyperedgeId ?? null;
        return edgeId ? hypergraph.edges.get(edgeId)?.displayName ?? id : id;
      });
      const highlighted = optNames[cursor] ?? optNames[0] ?? '';
      const defaultName = optNames[0] ?? '';
      const others = optNames.slice(1);

      const short =
        optNames.length === 0
          ? ''
          : `Parent contexts for ${sourceName}: ${optNames.length} options, selected ${highlighted}.`;
      const long =
        optNames.length === 0
          ? ''
          : others.length > 0
            ? `Parent contexts for ${sourceName}. ${optNames.length} options. Default: ${defaultName}. Other options: ${others.join(', ')}. Currently selected: ${highlighted}.`
            : `Parent contexts for ${sourceName}. Default: ${defaultName}.`;
      return { short, long };
    },
  };
}

export function registerBuiltinTokens<P>(registry: TokenRegistry<P>): void {
  registry.register(nameToken<P>());
  registry.register(indexToken<P>());
  registry.register(levelToken<P>());
  registry.register(parentToken<P>());
  registry.register(childrenToken<P>());
  registry.register(parentContextsToken<P>());
}
