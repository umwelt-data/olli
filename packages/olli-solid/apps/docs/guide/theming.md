# Theming

Olli ships a single stylesheet for its tree view and dialog components. A developer integrating Olli into a page imports it once, then overrides CSS variables or class rules to match the host site.

## Import the stylesheet

Import the stylesheet once, at the top of the entry file that mounts Olli.

```js
import 'olli-js/styles.css';
```

Without this import, the tree renders unstyled: every branch stays visible and the focused node has no highlight.

## What the defaults do

A user who navigates the tree with the arrow keys sees only the path from the root to the currently focused node. Siblings and the focused node's own children are hidden. The focused node gets a grey background and a black border on its label.

## Override with CSS variables

The stylesheet defines five variables on `.olli-vis`, the wrapper class on the root tree element. Set any of them on `.olli-vis` or any ancestor to theme the tree.

| Variable | Default | Purpose |
| --- | --- | --- |
| `--olli-focus-border` | `black` | Border color of the focused label |
| `--olli-focus-bg` | `#eee` | Background color of the focused label |
| `--olli-hover-bg` | `#ddd` | Background color on label hover |
| `--olli-indent` | `1.5em` | Left padding of each nested tree group |
| `--olli-virtual-style` | `italic` | `font-style` for virtual parent-context nodes |

Example override, scoped to a single Olli instance:

```css
.my-olli-container .olli-vis {
  --olli-focus-bg: #fff3b0;
  --olli-focus-border: #8a6d00;
}
```

## Override a class

For anything the variables do not cover, target the class directly. Every style rule is scoped under `.olli-vis`, so a rule with equal or greater specificity wins.

```css
.olli-vis .olli-node-label {
  font-family: 'Iowan Old Style', serif;
}
```

The class names the stylesheet uses are:

- `.olli-vis` — the root `<ul role="tree">` element
- `.olli-tree-item` — each `<li role="treeitem">`
- `.olli-tree-item.olli-focused` — the currently focused item
- `.olli-tree-item.olli-virtual` — a synthesized virtual parent-context item
- `.olli-tree-group` — each child `<ul role="group">`
- `.olli-node-label` — the label `<span>` inside each item
- `.olli-dialog-overlay`, `.olli-dialog` — the [secondary dialog surface](/guide/extending#dialogs)

## Ship your own stylesheet

If a host site wants full control, it can skip the Olli import and write its own stylesheet against these class names. The renderer does not inject any inline styles, so the class hooks above are the full contract.
