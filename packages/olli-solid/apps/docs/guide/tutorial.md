# Tutorial

This page walks through navigating a live Olli tree. Open the [bar chart example](/gallery/bar-chart) in another tab and follow along with a screen reader turned on.

## Focus the tree

Tab through the page until the screen reader announces the root of the Olli tree. The root describes the chart as a whole — for the bar chart example, something like *"a bar chart. x-axis titled category. y-axis titled value."*

The tree is organized into levels. The root is level one; axes and legends sit one level below; categories and intervals sit another level below; individual data points are at the bottom. Each keystroke moves by one level or one sibling.

## Move down a level

Press the down arrow. Focus moves to the first child of the root — the x-axis. The screen reader announces *"x-axis titled category. 4 values."* This is a **guide** node.

Press down again to enter the x-axis. The screen reader announces the first category: *"category equals A. 1 of 4."*

## Step across siblings

Press the right arrow. Focus moves to the next category: *"category equals B. 2 of 4."* Keep pressing right to step through C and D. Press left to go back.

Press End to jump straight to the last category in the level; press Home to return to the first.


## Open the data as a table

With focus on any node, press `t`. A table dialog opens with one row per data point under the current focus. Arrow through the rows and columns; press Escape to close and return focus to where it was.

## Jump across the chart

From anywhere in the tree, press a single letter to jump:

- `x` — jump to the x-axis
- `y` — jump to the y-axis
- `l` — jump to the legend, if the chart has one

Jumps put focus on the guide node itself. Press down from there to enter.

## Leave and return to the tree

Tab away from the tree to read the surrounding page. To jump back, press `o` from anywhere outside a text input. Focus returns to wherever it was when the tree last had focus.


## Filter the data

Press `f` to open the filter dialog. Add or remove filters on any field. The tree rebuilds to reflect only the remaining rows. Press Escape to close.

## Targeted navigation

Press `r` to open the targeted-navigation dialog. Type a value and the dialog focuses the first matching node. Useful for deep trees where arrow-stepping is slow.

## Next

- [Concepts](/guide/concepts) — the four-level mental model behind the tree, explained.
- [Gallery](/gallery/) — more charts to try the same walkthrough on.
