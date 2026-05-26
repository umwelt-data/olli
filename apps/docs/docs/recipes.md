# Recipes & Customization

A recipe is an ordered list of token entries that controls what text appears in a node's description. The customization store manages active recipes per role and supports presets.

## RecipeEntry

```ts
interface RecipeEntry {
  token: TokenName;
  brevity: Brevity;
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `token` | `string` | yes | The token name to include (e.g., `'name'`, `'visData'`). |
| `brevity` | `'short' \| 'long'` | yes | Which form of the token value to use. |

A recipe is simply `RecipeEntry[]`. The order of entries determines the order of text fragments in the assembled description.

## Customization

```ts
interface Customization {
  role: string;
  recipe: readonly RecipeEntry[];
}
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `role` | `string` | yes | The hyperedge role this customization applies to (e.g., `'root'`, `'xAxis'`, `'filteredData'`). |
| `recipe` | `RecipeEntry[]` | yes | The ordered token entries. |

Customizations are automatically persisted to `localStorage` and restored on subsequent page loads.

## CustomizationStore

The runtime creates a `CustomizationStore` that manages customizations per role:

```ts
interface CustomizationStore {
  activeFor(role: string): Accessor<Customization>;
  setFor(role: string, customization: Customization): void;
  resetFor(role: string): void;
  registerPreset(name: string, customizations: readonly Customization[]): void;
  applyPreset(name: string): void;
  activePresetName(): string | null;
  listPresets(): ReadonlyArray<{ name: string; customizations: readonly Customization[] }>;
  setRecipeFilter(fn: RecipeFilter | null): void;
  recipeFilter(): RecipeFilter | null;
}
```

### Key methods

| Method | Description |
| --- | --- |
| `activeFor(role)` | Returns a reactive accessor for the active customization for a role. |
| `setFor(role, customization)` | Sets a custom recipe for a role. |
| `resetFor(role)` | Resets to the default recipe. |
| `registerPreset(name, customizations)` | Adds a named preset. |
| `applyPreset(name)` | Applies all customizations from a preset. |
| `activePresetName()` | Returns the currently active preset name, or `null`. |
| `listPresets()` | Returns all registered presets. |
| `setRecipeFilter(fn)` | Sets a function that post-processes recipes (e.g., hiding the `parent` token when there are no multi-parent nodes). |

## Default recipe

When no customization or preset is active, the default recipe is:

```ts
const DEFAULT_RECIPE: RecipeEntry[] = [
  { token: 'name', brevity: 'long' },
  { token: 'index', brevity: 'short' },
  { token: 'parent', brevity: 'long' },
  { token: 'children', brevity: 'short' },
];
```

Virtual parent-context nodes have their own default:

```ts
const DEFAULT_VIRTUAL_RECIPE: RecipeEntry[] = [
  { token: 'parentContext', brevity: 'long' },
];
```

## Recipe filters

The runtime installs a recipe filter that removes the `parent` token when no edges of the given role have multiple parents. This prevents announcing "parent: X" on nodes where there's only one possible parent — the information adds no value.

```ts
type RecipeFilter = (role: string, recipe: readonly RecipeEntry[]) => readonly RecipeEntry[];
```

## How recipes drive descriptions

When the `describe` function assembles a description for a nav node:

1. It looks up the node's role (from `edge.role`).
2. It calls `customization.activeFor(role)()` to get the current recipe.
3. For each `RecipeEntry` in the recipe, it finds the corresponding token by name.
4. It calls `token.compute(context)` and selects `short` or `long` based on `entry.brevity`.
5. Non-empty results are assembled into a single string using join hints.

This means you can customize descriptions by:
- Reordering entries in the recipe.
- Changing `brevity` from `'long'` to `'short'` (or vice versa).
- Adding or removing token entries.
- Registering entirely new tokens and including them in a recipe.

## Next

- [Presets](/docs/presets) — the built-in vis presets.
- [Tokens](/docs/tokens) — the token types and built-in tokens.
- [Contributing Tokens](/docs/domain-tokens) — adding custom tokens.
