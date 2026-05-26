# Contributing Keybindings

Keybindings add keyboard shortcuts beyond the built-in navigation keys. The vis domain uses them for jump-to shortcuts (`x`, `y`, `l`). You can add your own.

## KeybindingContribution\<P\>

```ts
interface KeybindingContribution<P> {
  key: string;
  label?: string;
  group?: string;
  handler: (runtime: NavigationRuntime<P>, event: KeyboardEvent) => boolean;
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `key` | `string` | yes | The `event.key` value to match (e.g., `'x'`, `'j'`, `'1'`). |
| `label` | `string` | no | Description shown in the help dialog. |
| `group` | `string` | no | Group heading in the help dialog. |
| `handler` | `function` | yes | Called when the key is pressed. Return `true` if handled, `false` to pass through. |

Keybindings are skipped when modifier keys (Ctrl, Alt, Meta) are held. This prevents conflicts with browser and screen reader shortcuts.

## Writing a keybinding

Here's a keybinding that jumps to the first group node:

```ts
import type { KeybindingContribution } from 'olli-core';
import type { MyPayload } from './spec.js';

export function jumpToFirstGroup(): KeybindingContribution<MyPayload> {
  return {
    key: 'g',
    label: 'Jump to first group',
    group: 'Navigation',
    handler: (runtime) => {
      const graph = runtime.hypergraph();
      for (const [, edge] of graph.edges) {
        if (edge.role === 'group') {
          const navTree = runtime.navTree();
          for (const [navId, node] of navTree.byNavId) {
            if (node.hyperedgeId === edge.id) {
              runtime.focus(navId);
              return true;
            }
          }
        }
      }
      return false;
    },
  };
}
```

The handler has access to the full runtime — it can read the hypergraph, nav tree, and focused node, then call `runtime.focus()` to move focus.

Return `true` to indicate the key was handled (prevents default behavior). Return `false` to let other keybindings or the browser handle it.

## Registering keybindings

Add to your domain object:

```ts
export const myDomain: OlliDomain<MySpec, MyPayload> = {
  name: 'my-domain',
  toHypergraph: lowerMySpec,
  keybindings: [jumpToFirstGroup()],
};
```

Or register directly:

```ts
runtime.registerKeybinding(jumpToFirstGroup());
```

## KeybindingRegistry

```ts
interface KeybindingRegistry<P> {
  register(binding: KeybindingContribution<P>): void;
  list(): readonly KeybindingContribution<P>[];
  dispatch(runtime: NavigationRuntime<P>, event: KeyboardEvent): boolean;
}
```

The `dispatch` method is called by the renderer on every keydown event. It iterates through registered bindings, skipping events with modifier keys, and calls each handler until one returns `true`.

## Real-world example: vis jump shortcuts

The vis domain registers three jump shortcuts:

```ts
function jumpToNodeType(nodeType: string): KeybindingContribution<VisPayload> {
  return {
    key: nodeType === 'xAxis' ? 'x' : nodeType === 'yAxis' ? 'y' : 'l',
    label: `Jump to ${nodeType === 'xAxis' ? 'X axis' : nodeType === 'yAxis' ? 'Y axis' : 'legend'}`,
    group: 'Jump to section',
    handler: (runtime) => {
      const graph = runtime.hypergraph();
      for (const [, edge] of graph.edges) {
        if (edge.payload?.nodeType === nodeType) {
          const navTree = runtime.navTree();
          for (const [navId, node] of navTree.byNavId) {
            if (node.hyperedgeId === edge.id) {
              runtime.focus(navId);
              return true;
            }
          }
        }
      }
      return false;
    },
  };
}
```

## Next

- [Contributing Dialogs](/docs/domain-dialogs) — adding interactive overlays.
- [Contributing Predicates](/docs/domain-predicates) — adding data selection logic.
