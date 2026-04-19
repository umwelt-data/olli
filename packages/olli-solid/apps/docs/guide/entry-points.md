# Entry points

`olli-js` exposes three entry points. They all render the same kind of accessible tree and return the same `OlliHandle`; they differ in what they accept as input.

## `olliVis` for visualizations

```ts
import { olliVis, VegaLiteAdapter } from 'olli-js';

const olliSpec = await VegaLiteAdapter(vlSpec);
const handle = olliVis(olliSpec, document.getElementById('tree'));
```

Use `olliVis` when the data is tabular and the rendered view is a chart. It accepts an `OlliVisSpec`, which is Olli's own normalized chart description. Adapters in `olli-adapters` convert from Vega-Lite (`VegaLiteAdapter`), Vega (`VegaAdapter`), and Observable Plot (`ObservablePlotAdapter`) into `OlliVisSpec`.

`olliVis` wires in the visualization domain: x/y/l jump keys, the table/filter/targeted-nav dialogs, and the `high`/`medium`/`low` verbosity presets. See [Visualizations](/guide/visualizations) for the tree shape.

## `olliDiagram` for diagrams

```ts
import { olliDiagram } from 'olli-js';
import { pulleyMedium } from 'olli-diagram/examples';

const handle = olliDiagram(pulleyMedium, document.getElementById('tree'));
```

Use `olliDiagram` when the data is relational—including both containment (grouping) and connection (edges). It accepts a `DiagramSpec` (hyperedges with parents and children) and uses the diagram domain. See [Diagrams](/guide/diagrams) for the hypergraph model.

## `olli` for raw hypergraphs

```ts
import { olli } from 'olli-js';

const handle = olli(myHypergraph, document.getElementById('tree'));
```

`olli` is the lowest-level entry point. It accepts a raw `Hypergraph` and no domain, so nothing beyond the generic tokens and arrow-key navigation is wired in. Reach for this when you've already lowered your data into the hypergraph shape yourself, or when you're building a custom domain. See [Extending Olli](/guide/extending) for the latter.

## The `OlliHandle`

Each entry point returns an `OlliHandle` for controlling the tree after it's mounted.

```ts
handle.focus(navId);             // move focus to a specific node
handle.getFocusedNavId();        // read the current focus
handle.setSelection(sel);        // drive chart highlighting
handle.onFocusChange(cb);        // subscribe to focus changes
handle.onSelectionChange(cb);    // subscribe to selection changes
handle.fullPredicate(navId);     // compose all ancestor predicates into one Selection
handle.applyPreset('medium');    // switch verbosity at runtime
handle.setCustomization(role, c);// override one role's description recipe
handle.destroy();                // tear down the tree
```

`fullPredicate` is the hook for two-way highlighting: pair it with `onFocusChange` and feed the resulting `Selection` into your chart.

## Options

All three entry points accept the same optional third argument:

```ts
olliVis(spec, container, {
  initialPreset: 'medium',
  initialCustomization: { datum: { role: 'datum', recipe: [...], duration: 'persistent' } },
  initialSelection: mySelection,
  callbacks: {
    onFocus: (navId) => console.log('focus', navId),
    onSelection: (sel) => console.log('selection', sel),
  },
});
```

- `initialPreset`: name of a preset to apply on mount. For `olliVis`, `high`, `medium`, and `low` are built in.
- `initialCustomization`: per-role recipe overrides. Each entry names a `role`, an ordered list of tokens with `short`/`long` brevity, and whether it's `persistent` or `ephemeral`.
- `initialSelection`: selection to seed on mount.
- `callbacks.onFocus` / `callbacks.onSelection`: fired whenever the respective signal changes. Equivalent to calling `onFocusChange` / `onSelectionChange` on the handle.

## Verbosity presets

A preset is a bundle of per-role recipes. Applying a preset swaps every role's description recipe at once. `olli-vis` ships three:

- `high`: long descriptions everywhere. Announces field lists on data rows.
- `medium`: short descriptions at leaves, long at the root. A reasonable default.
- `low`: short descriptions everywhere.

The three presets correspond to the verbosity levels from the [CHI '24 customization paper](http://vis.csail.mit.edu/pubs/customization-accessible-vis/), which explored how descriptions could be changed to fit different needs and preferences.

A host page can wire a UI control to `handle.applyPreset` so a user can change verbosity without reloading. For finer control, call `handle.setCustomization(role, recipe)` directly.
