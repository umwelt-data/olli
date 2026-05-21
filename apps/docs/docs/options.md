# Options & Callbacks

All three entry points (`olliVis`, `olliDiagram`, `olli`) accept the same optional third argument.

```ts
import type { OlliOptions } from 'olli';
```

## `OlliOptions`

```ts
interface OlliOptions {
  initialPreset?: string;
  initialCustomization?: Record<string, Customization>;
  initialSelection?: Selection;
  callbacks?: {
    onFocus?: (navId: NavNodeId) => void;
    onSelection?: (selection: Selection) => void;
  };
}
```

### `initialPreset`

Name of a preset to apply on mount. For `olliVis`, the built-in presets are `'detailed'`, `'standard'`, and `'minimal'`.

```ts
olliVis(spec, container, { initialPreset: 'standard' });
```

### `initialCustomization`

Per-role recipe overrides applied on mount. Each key is a role name; each value is a `Customization`:

```ts
olliVis(spec, container, {
  initialCustomization: {
    datum: {
      role: 'datum',
      recipe: [
        { token: 'name', brevity: 'short' },
        { token: 'index', brevity: 'short' },
      ],
      duration: 'persistent',
    },
  },
});
```

A `Customization` has three fields:
- `role` — which type of node this applies to
- `recipe` — an ordered list of `{ token: string, brevity: 'short' | 'long' }` entries
- `duration` — `'persistent'` (stays until explicitly changed) or `'ephemeral'` (resets on next navigation)

### `initialSelection`

A `Selection` to seed on mount. This sets the initial selection state of the tree.

```ts
olliVis(spec, container, {
  initialSelection: { and: [{ field: 'region', equal: 'North' }] },
});
```

### `callbacks`

Subscribe to changes at mount time. These are equivalent to calling `handle.onFocusChange` and `handle.onSelectionChange` after mount.

```ts
olliVis(spec, container, {
  callbacks: {
    onFocus: (navId) => console.log('focus:', navId),
    onSelection: (sel) => console.log('selection:', sel),
  },
});
```

## Verbosity presets

A preset is a bundle of per-role recipes. Applying a preset swaps every role's description recipe at once. `olliVis` ships three:

| Preset | Description |
| --- | --- |
| `detailed` | Long descriptions everywhere. Announces field lists, aggregate statistics, and more on data items. |
| `standard` | Short descriptions with a balanced set of tokens. A reasonable default. |
| `minimal` | Short descriptions with fewer tokens. |

The three presets correspond to the verbosity levels from the [CHI '24 customization paper](https://data-and-design.org/publications/customization/).

Switch presets at mount time with `initialPreset`, or at runtime with `handle.applyPreset('standard')`. For finer control, use `handle.setCustomization(role, recipe)`.

## Next

- [OlliHandle](/docs/handle) — the full handle API.
- [Entry Points](/docs/entry-points) — which function to call.
