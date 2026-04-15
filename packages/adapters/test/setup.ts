// Mirror of packages/core/test/setup.ts — same stubs for the adapter corpus.

// vega-scenegraph eagerly touches canvas; stub to quiet the jsdom warning.
window.HTMLCanvasElement.prototype.getContext = (() => null) as any;
