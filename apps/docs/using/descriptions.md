# Customizing Descriptions

When you navigate a tree, your screen reader announces a description at each item. Olli lets you control what information appears in these descriptions and how detailed it is.

## What descriptions contain

A description is assembled from several pieces of information, each called a **token**:

- **Name**: what the item is (e.g., "bar chart" or "category equals North")
- **Position**: where it sits among siblings (e.g., "1 of 4")
- **Depth level**: how deep in the tree you are
- **Parent**: which group this item belongs to
- **Children**: how many items are inside
- **Data range**: the range of values (for axes)
- **Aggregate statistics**: summary statistics like mean and standard deviation
- **Size**: how many data points
- **Type**: the chart type (e.g., "bar chart", "scatterplot")

Not all tokens appear for every item — an axis item shows data range, while the root item shows chart type. The tokens that appear depend on the kind of item and the active preset.

## Presets

Presets let you switch the overall level of detail in one step. Olli ships with three presets for chart trees:

- **Detailed**: long descriptions everywhere. Announces field lists, aggregate statistics, and more at data items.
- **Standard**: short descriptions with a balanced set of tokens. A reasonable default.
- **Minimal**: short descriptions with fewer tokens.

The developer who integrated Olli may have set a default preset. You can switch between them using the description settings dialog.

## Using the description settings dialog

Press `d` to open the description settings dialog. It has several controls:

**Role selector.** Choose which type of item to customize: chart overview, x-axis, y-axis, legend, data group, and so on. Your changes apply to all items of that type.

**Preset buttons.** Quick buttons to switch between the available presets. Choosing a preset resets all your custom changes.

**Token toggles.** Turn individual tokens on or off. For example, if you don't need to hear the depth level at every item, turn it off.

**Brevity selector.** For each token, choose between a concise or a full version. The concise version is shorter; the full version includes more context.

**Token order.** Move tokens up or down to change the order they appear in the description. Put the information you care about most at the beginning.

**Preview.** See a live preview of how the description will sound with your current settings.

**Reset.** Return to the default settings.

## How long changes last

Your customizations are saved in your browser and persist across page reloads and sessions. If you clear your browser data, they reset to the default. The developer who integrated Olli may set a specific starting configuration, but your saved preferences take priority on subsequent visits.

## Next

- [Getting Started](/using/) — walkthrough of basic navigation.
- [Keyboard Controls](/using/keyboard-controls) — full shortcut reference.
