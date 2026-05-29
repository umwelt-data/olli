# olli-render-solid

Layer 3: Solid components that render a `NavigationRuntime` as an accessible ARIA tree view.

## Components

- **`TreeView`** — Root `<ul role="tree">` container, keydown dispatch to runtime keybinding registry
- **`TreeItem`** — Recursive `<li role="treeitem">` with ARIA attributes
- **`NodeLabel`** — Renders reactive `describe(navId)` as the announced label
- **`Dialog`** — Focus-trapping modal shell, handles Escape
- **`descriptionSettingsDialog`** — Preset/customization settings dialog
- **`helpDialog`** — Keyboard shortcut help dialog

## API

- `mount(runtime, container, options?)` — Renders the tree view, returns a dispose function
- `registerDefaultKeybindings(runtime)` — Registers arrow key navigation (up/down a level, prev/next sibling), Home/End, Escape (up a level), Enter/Space (down a level), and `o` (jump to root)

## Dependencies

- `olli-core`, `solid-js`, `ua-parser-js`
