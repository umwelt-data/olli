# Olli docs site

VitePress site for the [Olli](https://github.com/umwelt-data/olli) project. Deploys to `umwelt-data.github.io/olli/`.

## Scripts

From the workspace root:

- `pnpm --filter docs dev` — start the dev server at `http://localhost:5173/olli/`.
- `pnpm --filter docs build` — build the static site into `apps/docs/.vitepress/dist/`.

## Structure

```
apps/docs/
  .vitepress/
    config.ts           — site config (nav, sidebars, search, social)
  using/                — user-facing prose (how to use olli)
  docs/                 — API/technical documentation
  gallery/              — runnable examples
  public/               — static assets served at /olli/
  index.md              — landing page
```

## Adding a gallery example

Gallery examples live in `gallery/examples/`, organized by toolkit (`vega-lite/`, `bluefish/`).

### Steps

1. **Create the example file** in `gallery/examples/vega-lite/my-chart.ts` or `gallery/examples/bluefish/my-diagram.ts`. Follow the pattern of existing examples — export a `VisualizationExample` or `DiagramExample` object matching the types in `gallery/examples/types.ts`.

2. **Register in `gallery/examples/index.ts`** — import your example and add it to the `examples` array.

3. **Add to `gallery/examples/groups.ts`** — this controls sidebar navigation. Add an `{ id, title }` entry in the appropriate group.

4. **Add to `gallery/examples/paths-metadata.ts`** — this controls VitePress route generation. Add a matching `{ id, title }` entry.

5. **Compile the examples:**
   ```bash
   npm run build:examples
   ```
   This runs `tsc` over `gallery/examples/tsconfig.json`, producing JS/map/d.ts files alongside the source.

6. **Commit the compiled artifacts.** The compiled JS files are version-controlled by design — VitePress needs them in Node context during build without the full TypeScript toolchain.

7. **Test locally:**
   ```bash
   pnpm --filter docs dev
   ```
   Navigate to `/olli/gallery/my-chart/` to verify.

### Why three metadata files?

- **`index.ts`** — full example objects with all imports (used at runtime)
- **`groups.ts`** — lightweight sidebar structure (no heavy imports, used in VitePress config)
- **`paths-metadata.ts`** — minimal id/title pairs (used by VitePress `[id].paths.ts` for route generation)

This avoids circular dependencies and lets different parts of the build load only what they need.

## Deployment

Deploys are currently manual. Build with `pnpm --filter docs build`, then push `.vitepress/dist/` to `gh-pages`.
