# Contributing Dialogs

Dialogs are interactive overlays triggered by keyboard shortcuts. The vis domain provides table, filter, targeted navigation, and description settings dialogs. You can add your own.

## DialogContribution\<P\>

```ts
interface DialogContribution<P> {
  id: string;
  label: string;
  applicableRoles?: readonly string[];
  triggerKey?: string;
  render?: (runtime: NavigationRuntime<P>, navNode: NavNode) => DialogRenderResult;
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | yes | Unique identifier (e.g., `'table'`, `'filter'`). |
| `label` | `string` | yes | Display name shown in the help dialog. |
| `applicableRoles` | `string[]` | no | Which roles can open this dialog. Omit for all roles. |
| `triggerKey` | `string` | no | Keyboard key that opens the dialog (e.g., `'t'`, `'f'`). |
| `render` | `function` | no | Produces the dialog content. |

## DialogRenderResult

```ts
interface DialogRenderResult {
  title: string;
  description?: string;
  content: unknown;
  onSubmit?: () => void;
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | `string` | yes | Dialog heading, announced by screen readers. |
| `description` | `string` | no | Additional context below the title. |
| `content` | `unknown` | yes | The dialog body. In the Solid.js renderer, this is a JSX element. |
| `onSubmit` | `() => void` | no | Called when the dialog is submitted (if applicable). |

The `content` type is `unknown` because the core doesn't depend on a specific UI framework. The Solid.js renderer expects Solid JSX elements.

## Writing a dialog

```ts
import type { DialogContribution } from 'olli-core';
import type { MyPayload } from './spec.js';

export function myInfoDialog(): DialogContribution<MyPayload> {
  return {
    id: 'info',
    label: 'Element info',
    triggerKey: 'i',
    applicableRoles: ['element'],
    render: (runtime, navNode) => {
      const edge = navNode.hyperedgeId
        ? runtime.getHyperedge(navNode.hyperedgeId)
        : undefined;
      const el = edge?.payload?.element;

      return {
        title: `Info: ${el?.label ?? 'Unknown'}`,
        description: el?.category ? `Category: ${el.category}` : undefined,
        content: null, // or a JSX element for richer content
      };
    },
  };
}
```

## Registering dialogs

Add to your domain object:

```ts
export const myDomain: OlliDomain<MySpec, MyPayload> = {
  name: 'my-domain',
  toHypergraph: lowerMySpec,
  dialogs: [myInfoDialog()],
};
```

Or register directly:

```ts
runtime.registerDialog(myInfoDialog());
```

## DialogRegistry

```ts
interface DialogRegistry<P> {
  register(dialog: DialogContribution<P>): void;
  list(): readonly DialogContribution<P>[];
  byId(id: string): DialogContribution<P> | undefined;
}
```

The renderer uses `dialogs.list()` to build the help dialog and `dialogs.byId(id)` to look up a specific dialog.

## How the renderer uses dialogs

The renderer's keybinding system checks registered dialogs:

1. When a key is pressed, it looks for a dialog with a matching `triggerKey`.
2. If `applicableRoles` is set, it checks whether the focused node's role matches.
3. If both match, it calls `render(runtime, navNode)` to produce the dialog content.
4. The dialog is opened as a modal overlay with the returned `title`, `description`, and `content`.

## Next

- [Contributing Keybindings](/docs/domain-keybindings) — adding keyboard shortcuts.
- [Contributing Tokens](/docs/domain-tokens) — adding description tokens.
