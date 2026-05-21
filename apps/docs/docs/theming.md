# Theming & CSS

Olli ships a single stylesheet for its tree view and dialog components. A developer integrating Olli into a page imports it once, then overrides CSS variables or class rules to match the host site.

## Import the stylesheet

Import the stylesheet once, at the top of the entry file that mounts Olli.

```js
import 'olli/styles.css';
```

Without this import, the tree renders unstyled: every branch stays visible and the focused node has no highlight.

## What the defaults do

A user who navigates the tree with the arrow keys sees only the path from the root to the currently focused node. Siblings and the focused node's own children are hidden. The focused node gets a grey background on its label.

## Override with CSS variables

The stylesheet defines four variables on `.olli-vis`, the wrapper class on the root tree element. Set any of them on `.olli-vis` or any ancestor to theme the tree.

| Variable | Default | Purpose |
| --- | --- | --- |
| `--olli-focus-bg` | `#eee` | Background color of the focused label |
| `--olli-hover-bg` | `#ddd` | Background color on label hover |
| `--olli-indent` | `1.5em` | Left padding of each nested tree group |
| `--olli-virtual-style` | `italic` | `font-style` for virtual grouping nodes |

Example override, scoped to a single Olli instance:

```css
.my-olli-container .olli-vis {
  --olli-focus-bg: #fff3b0;
  --olli-hover-bg: #ffe180;
}
```

## Override a class

For anything the variables do not cover, target the class directly. Every style rule is scoped under `.olli-vis`, so a rule with equal or greater specificity wins.

```css
.olli-vis .olli-node-label {
  font-family: 'Iowan Old Style', serif;
}
```

## Class reference

| Class | Element |
| --- | --- |
| `.olli-vis` | Root `<ul role="tree">` element |
| `.olli-tree-item` | Each `<li role="treeitem">` |
| `.olli-tree-item.olli-focused` | The currently focused item |
| `.olli-tree-item.olli-virtual` | A synthesized grouping item |
| `.olli-tree-group` | Each child `<ul role="group">` |
| `.olli-node-label` | The label `<span>` inside each item |
| `.olli-dialog-overlay` | Dialog overlay backdrop |
| `.olli-dialog` | Dialog container |

## Ship your own stylesheet

If a host site wants full control, it can skip the Olli import and write its own stylesheet against these class names. The renderer does not inject any inline styles, so the class hooks above are the full contract.

## Next

- [Quickstart](/docs/quickstart) — a complete working example.
- [Installation](/docs/installation) — importing the stylesheet and other setup.
