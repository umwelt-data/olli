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
  optionIndexOfVirtual,
  sourceNavIdOfVirtual,
  virtualNavIdFor,
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

export type MoveDirection = 'up' | 'down' | 'left' | 'right' | 'first' | 'last';

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
  /**
   * For a real multi-parent nav node, return the ordered list of virtual-option
   * nav ids `[default, ...others]`. Returns `[]` when the source is not
   * multi-parent or is not a real node.
   */
  virtualOptionsFor(sourceNavId: NavNodeId): readonly NavNodeId[];
  /**
   * For a virtual nav id, return the underlying real parent nav id it would
   * commit to on Up. Returns `undefined` when the id is malformed or out of
   * range.
   */
  commitTargetOfVirtual(virtualNavId: NavNodeId): NavNodeId | undefined;
  /**
   * For a virtual nav id, return the nav id of the source hyperedge as a child
   * of the commit-target parent. This is X_i — the "same conceptual node,
   * regrouped under parent_i". Returns `undefined` on any resolution failure.
   */
  regroupedSourceOfVirtual(virtualNavId: NavNodeId): NavNodeId | undefined;

  // Actions
  focus(navId: NavNodeId): void;
  moveFocus(direction: MoveDirection): void;
  expand(navId: NavNodeId): void;
  collapse(navId: NavNodeId): void;
  setExpanded(set: ReadonlySet<NavNodeId>): void;
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
  const [expanded, setExpandedSignal] = createSignal<ReadonlySet<NavNodeId>>(new Set());

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

  function parentOptionsForSource(source: NavNode): readonly NavNodeId[] {
    if (source.hyperedgeId === null) return [];
    const edge = getHyperedge(source.hyperedgeId);
    if (!edge || edge.parents.length < 2) return [];
    const descentParentEdgeId = source.path[source.path.length - 2];
    const defaultParentNavId = source.parentNavId;
    const opts: NavNodeId[] = [];
    if (defaultParentNavId) opts.push(defaultParentNavId);
    const idx = navTree().hyperedgeToNavIds;
    for (const parentEdgeId of edge.parents) {
      if (parentEdgeId === descentParentEdgeId) continue;
      const candidates = idx.get(parentEdgeId) ?? [];
      const pick = candidates[0];
      if (pick && !opts.includes(pick)) opts.push(pick);
    }
    return opts;
  }

  function virtualOptionsFor(sourceNavId: NavNodeId): readonly NavNodeId[] {
    const source = getRealNavNode(sourceNavId);
    if (!source) return [];
    const parents = parentOptionsForSource(source);
    return parents.map((_, i) => virtualNavIdFor(sourceNavId, i));
  }

  function commitTargetOfVirtual(virtualNavId: NavNodeId): NavNodeId | undefined {
    const sourceNavId = sourceNavIdOfVirtual(virtualNavId);
    const source = getRealNavNode(sourceNavId);
    if (!source) return undefined;
    const parents = parentOptionsForSource(source);
    const i = optionIndexOfVirtual(virtualNavId);
    if (i < 0 || i >= parents.length) return undefined;
    return parents[i];
  }

  function regroupedSourceOfVirtual(virtualNavId: NavNodeId): NavNodeId | undefined {
    const ct = commitTargetOfVirtual(virtualNavId);
    if (!ct) return undefined;
    const sourceNavId = sourceNavIdOfVirtual(virtualNavId);
    const source = getRealNavNode(sourceNavId);
    if (!source || source.hyperedgeId === null) return undefined;
    const ctNode = getRealNavNode(ct);
    if (!ctNode || ctNode.hyperedgeId === null) return undefined;
    const parentEdge = getHyperedge(ctNode.hyperedgeId);
    if (!parentEdge || !parentEdge.children.includes(source.hyperedgeId)) return undefined;
    return `${ct}/${source.hyperedgeId}`;
  }

  function synthesizeVirtualNode(virtualNavId: NavNodeId): NavNode | undefined {
    const sourceNavId = sourceNavIdOfVirtual(virtualNavId);
    const source = getRealNavNode(sourceNavId);
    if (!source) return undefined;
    const parents = parentOptionsForSource(source);
    const i = optionIndexOfVirtual(virtualNavId);
    if (i < 0 || i >= parents.length) return undefined;
    return {
      navId: virtualNavId,
      kind: 'virtualParentContext',
      hyperedgeId: null,
      path: source.path,
      parentNavId: source.parentNavId ?? source.navId,
      childNavIds: [],
    };
  }

  function getNavNode(navId: NavNodeId): NavNode | undefined {
    if (isVirtualNavId(navId)) return synthesizeVirtualNode(navId);
    return getRealNavNode(navId);
  }

  function focus(navId: NavNodeId): void {
    setFocusedNavId(navId);
  }

  function moveFocus(direction: MoveDirection): void {
    const current = focusedNavId();
    const node = getNavNode(current);
    if (!node) return;

    if (node.kind === 'virtualParentContext') {
      const sourceNavId = sourceNavIdOfVirtual(current);
      const siblings = virtualOptionsFor(sourceNavId);
      if (siblings.length === 0) return;
      const i = optionIndexOfVirtual(current);
      switch (direction) {
        case 'up': {
          const target = commitTargetOfVirtual(current);
          if (target) focus(target);
          return;
        }
        case 'down': {
          const rs = regroupedSourceOfVirtual(current);
          if (rs) focus(rs);
          return;
        }
        case 'left': {
          if (i <= 0) return;
          const target = siblings[i - 1];
          if (target) focus(target);
          return;
        }
        case 'right': {
          if (i >= siblings.length - 1) return;
          const target = siblings[i + 1];
          if (target) focus(target);
          return;
        }
        case 'first': {
          const target = siblings[0];
          if (target) focus(target);
          return;
        }
        case 'last': {
          const target = siblings[siblings.length - 1];
          if (target) focus(target);
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
        focus(virtualNavIdFor(current, 0));
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
      case 'first':
      case 'last': {
        if (!node.parentNavId) return;
        const parent = getRealNavNode(node.parentNavId);
        if (!parent || parent.childNavIds.length === 0) return;
        const target =
          direction === 'first'
            ? parent.childNavIds[0]
            : parent.childNavIds[parent.childNavIds.length - 1];
        if (target) focus(target);
        return;
      }
    }
  }

  function expand(navId: NavNodeId): void {
    setExpandedSignal((prev) => {
      if (prev.has(navId)) return prev;
      const next = new Set(prev);
      next.add(navId);
      return next;
    });
  }

  function collapse(navId: NavNodeId): void {
    setExpandedSignal((prev) => {
      if (!prev.has(navId)) return prev;
      const next = new Set(prev);
      next.delete(navId);
      return next;
    });
  }

  function setExpanded(set: ReadonlySet<NavNodeId>): void {
    setExpandedSignal(set);
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
    virtualOptionsFor,
    commitTargetOfVirtual,
    regroupedSourceOfVirtual,
    focus,
    moveFocus,
    expand,
    collapse,
    setExpanded,
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
