# Quickstart

This is the developer quickstart page. To get started as a user, check the [guide](/guide/).

Render a Vega-Lite bar chart with an Olli accessible tree next to it.

## Install

```bash
npm install olli-js vega-lite vega
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
      import { olliVis, VegaLiteAdapter } from 'olli-js';
      import 'olli-js/styles.css';

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

Open it, focus on the Olli tree. The initial root node describes the whole chart. Press the down arrow to go down a level and focus on individual bars. Use the left and right arrows to navigate between bars on the same level.

## What you just did

- `VegaLiteAdapter` reads the Vega-Lite spec and the rendered scenegraph to produce an `OlliVisSpec` — a description of the chart's structure in Olli's own vocabulary.
- `olliVis` takes that spec, builds a navigation tree, and mounts it into your container. It returns an `OlliHandle` for controlling focus, reading the current selection, and tearing down.

## Next

- [Entry points](/guide/entry-points) — `olliVis`, `olliDiagram`, `olli`, the handle surface, and options.
- [Theming](/guide/theming) — override the tree's colors and class rules.
- [Extending Olli](/guide/extending) — build a new domain on top of the same kernel.
- [Gallery](/gallery/) — runnable examples across chart types.

### Two-way highlighting with the chart

To have Olli's focus drive selection in the rendered Vega-Lite chart (dimming non-matching marks), add [`@umwelt-data/umwelt-utils`](https://github.com/umwelt-data/umwelt-utils) and wrap the spec with `withExternalStateParam` before compiling. See the [gallery source](https://github.com/umwelt-data/olli/blob/main/packages/olli-solid/apps/docs/gallery/components/VisualizationRenderer.vue) for the pattern.
