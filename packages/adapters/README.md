# Olli - Screen Reader Accessibility for Data Visualization

Olli is an open-source library for converting data visualizations into accessible text structures for screen reader users. Starting with an existing visualization specification created with a supported toolkit, Olli produces a keyboard-navigable tree view with descriptions at varying levels of detail. Users can explore these structures both to get an initial overview, and to dive into the data in more detail.

For more information about Olli, see the main project repo at https://github.com/umwelt-data/olli.

This is Olli's adapters package, published on `npm` as `olli-adapters`.

## Adapters

Because visualization toolkits are designed with different trade-offs
in mind, their APIs can vary widely. In order to support adding
accessibility to the widest possible range of visualizations, Olli
uses an adapter design pattern to convert visualization specifica-
tions from various toolkits into a common interface that can then
be rendered as accessible HTML. Olli accomplishes this by wrap-
ping an instance of another visualization toolkit within an adapter
function, which returns an `OlliVisSpec` object that corresponds to
the visualization. Olli then constructs a hierarchical data structure
containing descriptions for elements of the visualization, which is
then rendered as an accessible tree view. Because the accessible
structure is constructed from the standard `OlliVisSpec` interface,
this process is agnostic to the details of the toolkit with which the
original visualization was implemented.

To extend Olli’s coverage to support adding screen reader accessi-
bility to a new toolkit, developers can simply implement an adapter
function for that toolkit, without needing to re-implement the UX
details of the accessible visualization. This lowers the barrier for
visualization authors who lack specialized accessibility expertise to
offer accessible visualization experiences.

### OlliVisSpec

An adapter takes in a visualization toolkit’s output (e.g. an SVG, or
a scenegraph instance) and its original specification, and returns that
visualization as an object implementing the `OlliVisSpec` interface.
An OlliVisSpec object either describes a single visualization,
or contains a list of objects that each describe a single view of
a multi-view chart. Each object has information about a chart’s
visual elements, including its mark type and its guides (i.e. axes and
legends). It also has a list of names of data fields participating in
visual encodings, and other metadata such as the title.
Each view’s Guide objects contain a title, the name of the field
mapped to the axis/legend, and other metadata (e.g. the axis ori-
entation or legend type). They also include information needed to
divide axes and legends down into smaller sections (i.e., interval
extents for continuous guides and categories for discrete guides),
and a reference to the underlying data.

The `OlliVisSpec` type is defined here: https://github.com/umwelt-data/olli/blob/main/packages/core/src/Types.ts
