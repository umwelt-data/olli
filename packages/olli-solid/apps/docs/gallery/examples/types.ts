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
  /** Free-form tags used by the gallery index's filter UI. */
  tags: string[];
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
  /** Async: returns bluefish-js hyperscript children passed to mountBluefish. Dynamic import defers bluefish-js loading to browser context. */
  children: () => Promise<unknown[]>;
}

/** Returned by mountBluefish — kept here so DiagramRenderer can type its teardown state. */
export interface DiagramMount {
  svgElement: SVGSVGElement;
  destroy: () => void;
}
