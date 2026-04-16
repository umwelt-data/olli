import type { NavigationRuntime } from './runtime.js';
import type { NavNode } from './navtree.js';

export interface DialogContribution<P> {
  id: string;
  applicableRoles?: readonly string[];
  triggerKey?: string;
  /** Domain-specific renderer supplied by L3/L4; core does not inspect. */
  render?: (runtime: NavigationRuntime<P>, navNode: NavNode) => unknown;
}

export interface DialogRegistry<P> {
  register(dialog: DialogContribution<P>): void;
  list(): readonly DialogContribution<P>[];
  byId(id: string): DialogContribution<P> | undefined;
}

export function createDialogRegistry<P>(): DialogRegistry<P> {
  const dialogs: DialogContribution<P>[] = [];
  return {
    register(dialog) {
      dialogs.push(dialog);
    },
    list() {
      return dialogs;
    },
    byId(id) {
      return dialogs.find((d) => d.id === id);
    },
  };
}
