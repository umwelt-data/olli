# Olli - Screen Reader Accessibility for Data Visualization

Olli is an open-source library for converting data visualizations into accessible text structures for screen reader users. Starting with an existing visualization specification created with a supported toolkit, Olli produces a keyboard-navigable tree view with descriptions at varying levels of detail. Users can explore these structures both to get an initial overview, and to dive into the data in more detail. 

For a user tutorial, quickstart guide, and examples, see the [Olli website](https://umwelt-data.github.io/olli/).

## Package overview

- `/core` contains the main `olli` package. This package handles constructing and rendering an accessible tree structure from a visualization spec.
- `/adapters` contains the `olli-adapters` package. This package contains adapters for various visualization toolkits, including Vega, Vega-Lite, and Observable Plot. These adapters convert specs in the respective toolkit into the standard `OlliVisSpec` format.
