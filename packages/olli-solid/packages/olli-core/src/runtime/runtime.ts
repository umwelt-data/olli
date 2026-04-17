import { createMemo, createSignal, type Accessor } from 'solid-js';
import type { Hyperedge, HyperedgeId, Hypergraph } from '../hypergraph/types.js';
import type { Selection } from '../predicate/types.js';
import { EMPTY_AND } from '../predicate/types.js';
import type { CustomizationStore } from '../description/customization.js';
import { createCustomizationStore } from '../description/customization.js';
import { describe } from '../description/describe.js';
import {
  createTokenRegistry,
  registerBuiltinTokens,
  type DescriptionToken,
  type TokenRegistry,
} from '../description/tokens.js';
import {
  buildNavTree,
  isVirtualNavId,
  sourceNavIdOfVirtual,
  VIRTUAL_SUFFIX,
  type NavNode,
  type NavNodeId,
  type NavTree,
} from './navtree.js';
import {
  createKeybindingRegistry,
  type KeybindingContribution,
  type KeybindingRegistry,
} from './keybindings.js';
import {
  createDialogRegistry,
  type DialogContribution,
  type DialogRegistry,
} from './dialogs.js';
import {
  composeAncestorPredicates,
  createPredicateProviderRegistry,
  type PredicateProvider,
  type PredicateProviderRegistry,
} from './predicates.js';

export type MoveDirection = 'up' | 'down' | 'left' | 'right';

export interface NavigationRuntime<P> {
  // Reactive state
  hypergraph: Accessor<Hypergraph<P>>;
  navTree: Accessor<NavTree>;
  focusedNavId: Accessor<NavNodeId>;
  selection: Accessor<Selection>;
  expanded: Accessor<ReadonlySet<NavNodeId>>;

  // Lookups
  getNavNode(navId: NavNodeId): NavNode | undefined;
  getHyperedge(id: HyperedgeId): Hyperedge<P> | undefined;
  fullPredicate(navId: NavNodeId): Selection;
  virtualCursor(navId: NavNodeId): number;

  // Actions
  focus(navId: NavNodeId): void;
  moveFocus(direction: MoveDirection): void;
  expand(navId: NavNodeId): void;
  collapse(navId: NavNodeId): void;
  setSelection(s: Selection): void;
  setHypergraph(g: Hypergraph<P>): void;

  // Registries
  registerKeybinding(binding: KeybindingContribution<P>): void;
  registerDialog(dialog: DialogContribution<P>): void;
  registerPredicateProvider(provider: PredicateProvider<P>): void;
  registerToken(token: DescriptionToken<P>): void;
  keybindings: KeybindingRegistry<P>;
  dialogs: DialogRegistry<P>;
  predicateProviders: PredicateProviderRegistry<P>;
  tokens: TokenRegistry<P>;
  customization: CustomizationStore;

  // Descriptions
  getDescriptionFor(navId: NavNodeId): Accessor<string>;
}

export function createNavigationRuntime<P>(initialGraph: Hypergraph<P>): NavigationRuntime<P> {
  const [hypergraph, setHypergraphSignal] = createSignal(initialGraph, { equals: false });
  const navTree = createMemo(() => buildNavTree(hypergraph()));

  const initialFocus: NavNodeId = initialGraph.roots[0] ?? '';
  const [focusedNavId, setFocusedNavId] = createSignal<NavNodeId>(initialFocus);
  const [selection, setSelectionSignal] = createSignal<Selection>(EMPTY_AND);
  const [expanded, setExpanded] = createSignal<ReadonlySet<NavNodeId>>(new Set());
  const [virtualCursors, setVirtualCursors] = createSignal<ReadonlyMap<NavNodeId, number>>(
    new Map(),
  );

  const keybindings = createKeybindingRegistry<P>();
  const dialogs = createDialogRegistry<P>();
  const predicateProviders = createPredicateProviderRegistry<P>();
  const tokens = createTokenRegistry<P>();
  registerBuiltinTokens(tokens);
  const customization = createCustomizationStore();

  function getHyperedge(id: HyperedgeId): Hyperedge<P> | undefined {
    return hypergraph().edges.get(id);
  }

  function getRealNavNode(navId: NavNodeId): NavNode | undefined {
    return navTree().byNavId.get(navId);
  }

  function synthesizeVirtualNode(virtualNavId: NavNodeId): NavNode | undefined {
    const sourceNavId = sourceNavIdOfVirtual(virtualNavId);
    const source = getRealNavNode(sourceNavId);
    if (!source || source.hyperedgeId === null) return undefined;
    const edge = getHyperedge(source.hyperedgeId);
    if (!edge || edge.parents.length < 2) return undefined;

    const descentParentEdgeId = source.path[source.path.length - 2];
    const defaultParentNavId = source.parentNavId;

    const childNavIds: NavNodeId[] = [];
    if (defaultParentNavId) childNavIds.push(defaultParentNavId);

    const idx = navTree().hyperedgeToNavIds;
    for (const parentEdgeId of edge.parents) {
      if (parentEdgeId === descentParentEdgeId) continue;
      const candidates = idx.get(parentEdgeId) ?? [];
      const pick = candidates[0];
      if (pick && !childNavIds.includes(pick)) childNavIds.push(pick);
    }

    return {
      navId: virtualNavId,
      kind: 'virtualParentContext',
      hyperedgeId: null,
      path: source.path,
      parentNavId: null,
      childNavIds,
    };
  }

  function getNavNode(navId: NavNodeId): NavNode | undefined {
    if (isVirtualNavId(navId)) return synthesizeVirtualNode(navId);
    return getRealNavNode(navId);
  }

  function virtualCursor(navId: NavNodeId): number {
    return virtualCursors().get(navId) ?? 0;
  }

  function setVirtualCursor(navId: NavNodeId, n: number): void {
    setVirtualCursors((prev) => {
      const next = new Map(prev);
      next.set(navId, n);
      return next;
    });
  }

  function focus(navId: NavNodeId): void {
    setFocusedNavId(navId);
  }

  function moveFocus(direction: MoveDirection): void {
    const current = focusedNavId();
    const node = getNavNode(current);
    if (!node) return;

    if (node.kind === 'virtualParentContext') {
      const opts = node.childNavIds;
      if (opts.length === 0) return;
      const cursor = virtualCursor(current);
      switch (direction) {
        case 'up': {
          const target = opts[cursor];
          if (target) focus(target);
          return;
        }
        case 'down':
          return;
        case 'left': {
          if (cursor <= 0) return;
          setVirtualCursor(current, cursor - 1);
          return;
        }
        case 'right': {
          if (cursor >= opts.length - 1) return;
          setVirtualCursor(current, cursor + 1);
          return;
        }
      }
    }

    switch (direction) {
      case 'down': {
        const first = node.childNavIds[0];
        if (first) focus(first);
        return;
      }
      case 'up': {
        if (node.hyperedgeId === null) return;
        const edge = getHyperedge(node.hyperedgeId);
        if (!edge || edge.parents.length === 0) return;
        if (edge.parents.length === 1) {
          if (node.parentNavId) focus(node.parentNavId);
          return;
        }
        const virtualNavId = current + VIRTUAL_SUFFIX;
        setVirtualCursor(virtualNavId, 0);
        focus(virtualNavId);
        return;
      }
      case 'left':
      case 'right': {
        if (!node.parentNavId) return;
        const parent = getRealNavNode(node.parentNavId);
        if (!parent) return;
        const idx = parent.childNavIds.indexOf(current);
        if (idx < 0) return;
        const nextIdx = direction === 'right' ? idx + 1 : idx - 1;
        if (nextIdx < 0 || nextIdx >= parent.childNavIds.length) return;
        const target = parent.childNavIds[nextIdx];
        if (target) focus(target);
        return;
      }
    }
  }

  function expand(navId: NavNodeId): void {
    setExpanded((prev) => {
      if (prev.has(navId)) return prev;
      const next = new Set(prev);
      next.add(navId);
      return next;
    });
  }

  function collapse(navId: NavNodeId): void {
    setExpanded((prev) => {
      if (!prev.has(navId)) return prev;
      const next = new Set(prev);
      next.delete(navId);
      return next;
    });
  }

  function setSelectionAction(s: Selection): void {
    setSelectionSignal(() => s);
  }

  function setHypergraph(g: Hypergraph<P>): void {
    setHypergraphSignal(g);
  }

  function fullPredicate(navId: NavNodeId): Selection {
    const node = getNavNode(navId);
    if (!node) return EMPTY_AND;
    return composeAncestorPredicates(
      node.path,
      hypergraph().edges,
      predicateProviders.list(),
    );
  }

  const runtime: NavigationRuntime<P> = {
    hypergraph,
    navTree,
    focusedNavId,
    selection,
    expanded,
    getNavNode,
    getHyperedge,
    fullPredicate,
    virtualCursor,
    focus,
    moveFocus,
    expand,
    collapse,
    setSelection: setSelectionAction,
    setHypergraph,
    registerKeybinding: (b) => keybindings.register(b),
    registerDialog: (d) => dialogs.register(d),
    registerPredicateProvider: (p) => predicateProviders.register(p),
    registerToken: (t) => tokens.register(t),
    keybindings,
    dialogs,
    predicateProviders,
    tokens,
    customization,
    getDescriptionFor: (navId) => describe(runtime, tokens, customization, navId),
  };

  return runtime;
}
