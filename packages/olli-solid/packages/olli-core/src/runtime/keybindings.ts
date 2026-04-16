import type { NavigationRuntime } from './runtime.js';

export interface KeybindingContribution<P> {
  key: string;
  handler: (runtime: NavigationRuntime<P>, event: KeyboardEvent) => boolean;
}

export interface KeybindingRegistry<P> {
  register(binding: KeybindingContribution<P>): void;
  list(): readonly KeybindingContribution<P>[];
  dispatch(runtime: NavigationRuntime<P>, event: KeyboardEvent): boolean;
}

export function createKeybindingRegistry<P>(): KeybindingRegistry<P> {
  const bindings: KeybindingContribution<P>[] = [];
  return {
    register(binding) {
      bindings.push(binding);
    },
    list() {
      return bindings;
    },
    dispatch(runtime, event) {
      for (const b of bindings) {
        if (b.key === event.key && b.handler(runtime, event)) return true;
      }
      return false;
    },
  };
}
