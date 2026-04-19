---
layout: home

hero:
  name: Olli
  text: An accessible tree view for data visualizations
  tagline: Screen-reader navigation and keyboard exploration over any Vega-Lite chart, diagram, or custom visualization.
  actions:
    - theme: brand
      text: Guide
      link: /guide/
    - theme: alt
      text: Browse the gallery
      link: /gallery/
    - theme: alt
      text: View on GitHub
      link: https://github.com/umwelt-data/olli

features:
  - title: Works with what you already draw
    details: Adapters for Vega-Lite, Vega, and Observable Plot turn your existing specs into a navigable tree view with no extra markup.
  - title: Keyboard and screen-reader first
    details: Arrow-key navigation through four semantic levels — root, view, guide, data — with live descriptions that you can fully customize.
  - title: Beyond charts
    details: The same tree-navigation model extends to diagrams, networks, and other hypergraph-shaped data via the olli-diagram domain package.
---

## Install

```bash
npm install olli-js
```

Then render any Vega-Lite chart into a tree view:

```ts
import { olli, VegaLiteAdapter } from 'olli-js';

const spec = await new VegaLiteAdapter().spec(myVlSpec, myView);
olli(spec, document.getElementById('olli-tree')!);
```

See [Quickstart](/guide/quickstart) for the full pipeline, or the [Gallery](/gallery/) for runnable examples.

## Contributors

Point of contact:
- [Jonathan Zong](mailto:jzong@colorado.edu)


Contributors:
- Matt Blanco
- Daniel Hajas
- Jonathan Zong
- Arvind Satyanarayan
- Shuli Jones
- Isabella Pedraza Pineros
- Catherine Mei
- Josh Pollock

## Research

Learn more about the [research behind Olli](https://data-and-design.org/projects/olli/).