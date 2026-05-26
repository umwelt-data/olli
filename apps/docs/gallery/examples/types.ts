/**
 * Gallery example metadata. The gallery renderer picks a per-domain renderer
 * by the `domain` discriminator, and within a domain may pick a per-toolkit
 * sub-renderer (currently only `vega-lite`).
 */

export type GalleryExample = VisualizationExample | DiagramExample;

export interface BaseExample {
  /** kebab-case; also used as the URL slug at `/gallery/:id/`. */
  id: string;
  title: string;
  /** 1–2 sentences shown in the index card. */
  description?: string;
}

export interface VisualizationExample extends BaseExample {
  domain: 'visualization';
  /** Extensible: `gofish`, `observable-plot`, etc. when adapters land. */
  toolkit: 'vega-lite';
  /** The Vega-Lite spec. Typed as `unknown` to avoid a hard vega-lite type dep. */
  spec: unknown;
}

export interface DiagramExample extends BaseExample {
  domain: 'diagram';
  toolkit: 'bluefish';
  /** DiagramSpec passed to olliDiagram for the accessible tree. */
  spec: unknown;
  /** Async: returns bluefish-js render + elements from the same module instance to avoid duplicate runtimes. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: () => Promise<{ render: (code: () => any, element: any) => () => void; elements: unknown[] }>;
}

/** Returned by mountBluefish — kept here so DiagramRenderer can type its teardown state. */
export interface DiagramMount {
  svgElement: SVGSVGElement;
  destroy: () => void;
}
