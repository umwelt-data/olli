# olli-adapters

Layer 5: Adapters that convert visualization library specs into `OlliVisSpec`.

## Adapters

- **`VegaLiteAdapter`** — Compiles a Vega-Lite spec, extracts scenegraph data, produces `OlliVisSpec`
- **`VegaAdapter`** — Parses a Vega spec, extracts axes/legends/data from the scenegraph
- **`ObservablePlotAdapter`** — Renders an Observable Plot spec, extracts structure from the SVG

All adapters are async (they render the spec to extract runtime data).

## Usage

```ts
import { VegaLiteAdapter } from 'olli-adapters';
import { olliVis } from 'olli-js';

const spec = await VegaLiteAdapter(myVegaLiteSpec);
const handle = olliVis(spec, container);
```

## Dependencies

- `olli-vis`
- Peer: `vega` (optional), `vega-lite` (optional)
