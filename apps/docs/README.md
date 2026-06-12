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

1. **Create the example file** in `gallery/examples/vega-lite/my-chart.ts` or `gallery/examples/bluefish/my-diagram.ts`. Follow the pattern of existing examples — export a `VisualizationExample` or `DiagramExample` object matching the types in `gallery/examples/types.ts`. Titles are sentence case (`'Waterfall chart'`).

2. **Register in `gallery/examples/index.ts`** — import your example and add it to the `examples` array.

3. **Add to `gallery/examples/groups.ts`** — add an `{ id, title }` entry (same id and title as the example file) in the appropriate group. This drives sidebar navigation, the index page, and route generation.

4. **Test locally:**
   ```bash
   pnpm --filter docs dev
   ```
   Navigate to `/olli/gallery/my-chart/` to verify. Running `pnpm test` from the workspace root will also write an adapter structure snapshot for the new example.

There is no compile step — VitePress and Vitest load the TypeScript sources directly. `gallery/examples/examples.test.ts` enforces that `index.ts` and `groups.ts` stay in sync (matching ids and titles), so a forgotten registration fails `pnpm test` rather than silently producing a broken page or missing nav entry.

### Why two metadata files?

- **`index.ts`** — full example objects with all imports (used at runtime to render)
- **`groups.ts`** — lightweight id/title structure with no heavy imports, so VitePress can load it in Node context for the sidebar (`/.vitepress/config.ts`), the index page (`GalleryIndex.vue`), and route generation (`[id].paths.ts`)

## Deployment

Deploys are automatically done by Github workflow when pushing to main.
