# Olli docs site

VitePress site for the [Olli](https://github.com/umwelt-data/olli) project. Deploys to `umwelt-data.github.io/olli/`.

## Scripts

From the olli-solid workspace root:

- `pnpm --filter docs dev` — start the dev server at `http://localhost:5173/olli/`.
- `pnpm --filter docs build` — build the static site into `apps/docs/.vitepress/dist/`.

## Structure

```
apps/docs/
  .vitepress/
    config.ts           — site config (nav, sidebars, search, social)
  guide/                — hand-written user-facing prose
  gallery/              — runnable examples
  public/               — static assets served at /olli/
  index.md              — landing page
```

## Deployment

Phase 7 (deploy & cutover) adds a GitHub Action that runs `pnpm --filter docs build` and pushes `.vitepress/dist/` to `gh-pages`. Until then, deploys are manual.
