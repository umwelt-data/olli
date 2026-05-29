# Quickstart

Render a Vega-Lite bar chart with an Olli accessible tree next to it.

## Install

```bash
npm install olli vega-lite vega
```

## One-file example

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Olli quickstart</title>
  </head>
  <body>
    <div id="chart"></div>
    <div id="tree"></div>

    <script type="module">
      import { compile } from 'vega-lite';
      import { parse, View } from 'vega';
      import { olliVis } from 'olli';
      import { VegaLiteAdapter } from 'olli/adapters';
      import 'olli/styles.css';

      const spec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        data: {
          values: [
            { region: 'North', sales: 120 },
            { region: 'South', sales: 90 },
            { region: 'East', sales: 160 },
            { region: 'West', sales: 45 },
          ],
        },
        mark: 'bar',
        encoding: {
          x: { field: 'region', type: 'nominal' },
          y: { field: 'sales', type: 'quantitative' },
        },
      };

      // Render the chart.
      const view = new View(parse(compile(spec).spec), { renderer: 'svg' });
      await view.initialize(document.getElementById('chart')).runAsync();

      // Render the Olli tree next to it.
      const olliSpec = await VegaLiteAdapter(spec);
      olliVis(olliSpec, document.getElementById('tree'));
    </script>
  </body>
</html>
```

Open it, focus on the Olli tree. The root node describes the whole chart. Press the down arrow to enter the first axis, then left and right to navigate categories.

## What you just did

1. `VegaLiteAdapter` reads the Vega-Lite spec and produces an `OlliVisSpec` — Olli's own normalized chart description.
2. `olliVis` takes that spec, builds a navigation tree, and mounts it into your container. It returns an [`OlliHandle`](/docs/handle) for controlling focus, reading the current selection, and tearing down.

## Two-way highlighting

To have Olli's focus drive selection in the rendered Vega-Lite chart (dimming non-matching marks), add [`@umwelt-data/umwelt-utils`](https://github.com/umwelt-data/umwelt-utils), wrap the spec with `withExternalStateParam` before compiling, then connect the handle to the view with `connectOlliToVegaLite`. See the [gallery source](https://github.com/umwelt-data/olli/blob/main/apps/shared/mountVegaLite.ts) for the pattern.

## Next

- [Entry Points](/docs/entry-points) — `olliVis`, `olliDiagram`, `olli`, and when to use each.
- [OlliHandle](/docs/handle) — the full handle API.
- [Theming](/docs/theming) — override the tree's colors and class rules.
- [Gallery](/gallery/) — runnable examples across chart types.
