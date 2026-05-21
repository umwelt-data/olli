# Getting Started

Olli converts data visualizations and diagrams into accessible trees that you can navigate with the keyboard. At each item, your screen reader announces a description of what's in focus. The tree is organized into levels that correspond to different levels of detail — start at the overall summary, then drill down into axes, legends, categories, and individual data points.

## Screen reader setup

Olli uses single-key shortcuts (like arrow keys and letter keys). Your screen reader needs to be in the right mode for these to reach Olli.

**VoiceOver (macOS):** Turn off Quick Nav by pressing the Left Arrow and Right Arrow keys together. With Quick Nav off, your arrow keys and letter keys go directly to Olli.

**NVDA (Windows):** Switch to Focus mode. You can toggle this manually with NVDA+Space.

**JAWS (Windows):** Switch to Forms mode. Press Enter on the Olli tree description to activate it.

## Focus the tree

Navigate through the page until your screen reader announces the root of the Olli tree. The root describes the chart or diagram as a whole — for example, *"a bar chart. x-axis titled category. y-axis titled value."*

If you've navigated away from the tree and want to jump back, press `o` from anywhere on the page (outside a text input). Focus returns to wherever it was when the tree last had focus.

## Move down a level

Press the **Down Arrow**. Focus moves to the first child of the root — typically the x-axis. Your screen reader announces something like *"x-axis titled category. 4 values."*

Press **Down Arrow** again to go deeper. Now you hear the first category: *"category equals A. 1 of 4."*

## Step across siblings

Press **Right Arrow** to move to the next item at the same level: *"category equals B. 2 of 4."* Keep pressing Right Arrow to step through C and D. Press **Left Arrow** to go back.

Press **End** to jump to the last item at this level. Press **Home** to return to the first.

## Move back up

Press **Up Arrow** to go back up a level. You return to the guide node you came from.

## Open the data as a table

With focus on any item, press `t`. A table dialog opens with one row per data point under the current focus. Arrow through the rows and columns. Press **Escape** to close the table and return to where you were.

## Jump across the chart

From anywhere in a chart tree, press a single letter to jump:

- `x` — jump to the x-axis
- `y` — jump to the y-axis
- `l` — jump to the legend (if the chart has one)

These put focus on the guide itself. Press **Down Arrow** from there to enter it.

## Filter the data

Press `f` to open the filter dialog. Add or remove filters on any field. The tree rebuilds to show only the matching data. Press **Escape** to close.

## Targeted navigation

Press `r` to open the targeted navigation dialog. Type a value to jump directly to the first matching item. This is useful for large trees where arrow-stepping would be slow.

## Get help anytime

Press `?` to open the help dialog. It lists all available keyboard shortcuts for the current tree, along with screen reader setup reminders.

## Try it out

Open the [bar chart example](/gallery/bar-chart) in another tab and follow along with the steps above. Then explore the [gallery](/gallery/) for more charts and diagrams to practice with.

## Next

- [Keyboard Controls](/using/keyboard-controls) — complete reference of all keyboard shortcuts.
- [Understanding the Tree](/using/tree-structure) — how the tree is organized and what the descriptions mean.
- [Gallery](/gallery/) — more examples to explore.
