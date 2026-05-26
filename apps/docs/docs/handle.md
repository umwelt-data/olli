# OlliHandle

Each entry point (`olliVis`, `olliDiagram`, `olli`) returns an `OlliHandle` for controlling the tree after it's mounted.

```ts
import type { OlliHandle } from 'olli';
```

## Focus

### `focus(navId)`

```ts
handle.focus(navId: NavNodeId): void
```

Move focus to a specific node in the tree. The tree scrolls and the screen reader announces the new node's description.

### `getFocusedNavId()`

```ts
handle.getFocusedNavId(): NavNodeId
```

Returns the `NavNodeId` of the currently focused node.

## Selection

### `setSelection(selection)`

```ts
handle.setSelection(selection: Selection): void
```

Set the current selection. For `olliVis`, this triggers a reactive update: the spec is re-lowered with the new selection, and the tree rebuilds while preserving focus.

### `getSelection()`

```ts
handle.getSelection(): Selection
```

Returns the current `Selection`.

### `fullPredicate(navId)`

```ts
handle.fullPredicate(navId: NavNodeId): Selection
```

Compose the ancestor predicates along the path to `navId` into a single `Selection` describing the subset of the data at that node. This is independent of the selection signal (which is only changed by `setSelection`).

This is the hook for **two-way highlighting**: pair it with `onFocusChange` to feed the resulting `Selection` into your chart's selection mechanism.

```ts
handle.onFocusChange((navId) => {
  const sel = handle.fullPredicate(navId);
  // Feed `sel` into your chart to highlight matching marks
});
```

## Descriptions

### `getDescription(navId)`

```ts
handle.getDescription(navId: NavNodeId): string
```

Returns the assembled description string for a node, reflecting the current customization and preset settings.

## Customization

### `setCustomization(role, customization)`

```ts
handle.setCustomization(role: string, customization: Customization): void
```

Override the description recipe for a specific role. A `Customization` specifies:
- `role`: which type of node this applies to (e.g., `'root'`, `'xAxis'`, `'datum'`)
- `recipe`: an ordered list of `{ token: string, brevity: 'short' | 'long' }` entries

Changes made via `setCustomization` are automatically persisted to `localStorage`.

### `applyPreset(name)`

```ts
handle.applyPreset(name: string): void
```

Switch all role recipes at once by applying a named preset. For `olliVis`, the built-in presets are `'detailed'`, `'standard'`, and `'minimal'`.

## Subscriptions

### `onFocusChange(callback)`

```ts
handle.onFocusChange(cb: (navId: NavNodeId) => void): () => void
```

Subscribe to focus changes. The callback fires whenever the focused node changes. Returns an unsubscribe function.

### `onSelectionChange(callback)`

```ts
handle.onSelectionChange(cb: (selection: Selection) => void): () => void
```

Subscribe to selection changes. Returns an unsubscribe function.

## Lifecycle

### `destroy()`

```ts
handle.destroy(): void
```

Tear down the tree: unmount the renderer, clean up the global `o` hotkey listener, and dispose all reactive subscriptions.

## Two-way highlighting recipe

A common pattern is to have Olli's focus drive highlighting in a rendered chart:

```ts
const handle = olliVis(spec, treeContainer);

handle.onFocusChange((navId) => {
  const selection = handle.fullPredicate(navId);
  // Use `selection` to drive your chart's highlight state.
  // For Vega-Lite, see the gallery source for the
  // withExternalStateParam pattern.
});
```

## Next

- [Options & Callbacks](/docs/options) — configure the tree at mount time.
- [Adapters](/docs/adapters) — converting from external visualization formats.
