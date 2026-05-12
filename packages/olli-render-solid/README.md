# olli-render-solid

Layer 3: Solid components that render a `NavigationRuntime` as an accessible ARIA tree view.

## Components

- **`TreeView`** — Root `<ul role="tree">` container, keydown dispatch to runtime keybinding registry
- **`TreeItem`** — Recursive `<li role="treeitem">` with ARIA attributes (`aria-expanded`, `aria-selected`, `aria-level`, `aria-setsize`, `aria-posinset`)
- **`NodeLabel`** — Renders reactive `describe(navId)` as the announced label
- **`Dialog`** — Focus-trapping modal shell, handles Escape

## API

- `mount(runtime, container)` — Renders the tree view, returns a dispose function
- `registerDefaultKeybindings(runtime)` — Registers arrow key navigation, Enter expand/collapse

## Dependencies

- `olli-core`, `solid-js`
