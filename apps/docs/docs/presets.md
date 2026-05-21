# Presets

Presets are named collections of customizations that configure which tokens appear in descriptions at each verbosity level. The vis domain ships three presets: `detailed`, `standard`, and `minimal`.

## The three vis presets

### Detailed

All available tokens at `long` brevity. Maximum information density.

### Standard

A balanced set of tokens at `short` brevity. This is the default preset applied by the vis domain.

### Minimal

A reduced set of tokens at `short` brevity. Fastest to scan.

## Role/token matrix

The table below shows which tokens are included in each preset for each role. **D** = detailed, **S** = standard, **M** = minimal.

| Role | `name` | `visType` | `visData` | `visSize` | `parent` | `children` | `aggregate` | `quartile` | `instructions` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `root` | D S M | D S M | | D | | D S | | | D S M |
| `view` | D S M | D S | | | | D | | | |
| `xAxis` | D S M | D | D S M | | D S | | D S | | |
| `yAxis` | D S M | D | D S M | | D S | | D S | | |
| `legend` | D S M | D | D S M | | D S | | D S | | |
| `guide` | D S M | D | D S | | D | | | | |
| `filteredData` | | | D S M | D S | D | | D S | D | D S |
| `annotations` | D S M | | | D S | | | | | |
| `other` | | | D M | D S | | | | | D S |

## Brevity

- **Detailed** uses `long` brevity — each token's `long` text is used.
- **Standard** and **Minimal** use `short` brevity — each token's `short` text is used.

## How presets are registered

The vis domain calls `registerPreset` for each preset during domain registration:

```ts
runtime.customization.registerPreset('detailed', detailedCustomizations);
runtime.customization.registerPreset('standard', standardCustomizations);
runtime.customization.registerPreset('minimal', minimalCustomizations);
```

The vis domain also sets `defaultPreset: 'standard'`, so the standard preset is applied automatically.

## Applying presets programmatically

Use the `OlliHandle` or the runtime:

```ts
// Via OlliHandle
handle.applyPreset('detailed');

// Via runtime
runtime.customization.applyPreset('minimal');
```

## Custom presets

You can register your own presets:

```ts
runtime.customization.registerPreset('my-preset', [
  {
    role: 'root',
    recipe: [
      { token: 'name', brevity: 'short' },
      { token: 'visType', brevity: 'short' },
    ],
    duration: 'persistent',
  },
  {
    role: 'filteredData',
    recipe: [
      { token: 'visData', brevity: 'long' },
      { token: 'aggregate', brevity: 'long' },
    ],
    duration: 'persistent',
  },
]);

runtime.customization.applyPreset('my-preset');
```

Roles not covered by the preset retain their current customization.

## Next

- [Recipes & Customization](/docs/recipes) — how recipes and the customization store work.
- [Tokens](/docs/tokens) — the token types available to presets.
