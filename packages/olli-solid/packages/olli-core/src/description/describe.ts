import { createMemo, type Accessor } from 'solid-js';
import type { NavNodeId } from '../runtime/navtree.js';
import type { NavigationRuntime } from '../runtime/runtime.js';
import type { CustomizationStore } from './customization.js';
import {
  VIRTUAL_ROLE,
  isTokenApplicable,
  type TokenContext,
  type TokenRegistry,
} from './tokens.js';

function roleFor<P>(
  runtime: NavigationRuntime<P>,
  navId: NavNodeId,
): { role: string; context: TokenContext<P> } | null {
  const navNode = runtime.getNavNode(navId);
  if (!navNode) return null;

  let role: string;
  let edge = null;
  if (navNode.kind === 'virtualParentContext') {
    role = VIRTUAL_ROLE;
  } else if (navNode.hyperedgeId) {
    edge = runtime.getHyperedge(navNode.hyperedgeId) ?? null;
    role = edge?.role ?? '';
  } else {
    role = '';
  }

  const context: TokenContext<P> = {
    navNode,
    edge,
    hypergraph: runtime.hypergraph(),
    runtime,
    selection: runtime.selection(),
    fullPredicate: runtime.fullPredicate(navId),
  };
  return { role, context };
}

export function describe<P>(
  runtime: NavigationRuntime<P>,
  tokens: TokenRegistry<P>,
  customization: CustomizationStore,
  navId: NavNodeId,
): Accessor<string> {
  return createMemo(() => {
    const resolved = roleFor(runtime, navId);
    if (!resolved) return '';
    const { role, context } = resolved;
    const active = customization.activeFor(role)();

    const parts: string[] = [];
    for (const entry of active.recipe) {
      const token = tokens.byName(entry.token);
      if (!token) continue;
      if (!isTokenApplicable(token, role)) continue;
      const value = token.compute(context);
      const s = entry.brevity === 'long' ? value.long : value.short;
      if (s) parts.push(s);
    }
    return parts.join('. ');
  });
}
