# Olli docs site

VitePress site for the [Olli](https://github.com/umwelt-data/olli) project. Deploys to `umwelt-data.github.io/olli/`.

## Scripts

From the olli-solid workspace root:

- `pnpm --filter docs dev` — regenerate typedoc, start the dev server at `http://localhost:5173/olli/`.
- `pnpm --filter docs build` — regenerate typedoc, build the static site into `apps/docs/.vitepress/dist/`.
- `pnpm --filter docs build:api` — only regenerate the typedoc-driven API reference.

## Structure

```
apps/docs/
  .vitepress/
    config.ts           — site config (nav, sidebars, search, social)
    sidebar.api.ts      — AUTO-GENERATED sidebar fragment for /api/ (gitignored)
  guide/                — hand-written user-facing prose
  gallery/              — runnable examples (infrastructure: Phase 4; examples: Phases 5–6)
  api/                  — AUTO-GENERATED typedoc output (gitignored)
  scripts/
    build-typedoc.ts    — runs typedoc per package, writes api/ + sidebar.api.ts
  public/               — static assets served at /olli/
  index.md              — landing page
```

## Authoring TSDoc comments

The `/api/` section is entirely driven by TSDoc comments in the olli-solid packages. No API reference prose is hand-written.

### Guidelines

- Document **every exported symbol** you want in the public reference. Unexported or `@internal` symbols are omitted.
- Lead with a one-sentence summary. Add context, invariants, or edge cases below.
- Use `{@link SymbolName}` to cross-reference other exports. Typedoc resolves these into hyperlinks in the generated pages.
- Use triple-slash `@example` blocks for runnable snippets — they render as fenced code:

  ```ts
  /**
   * @example
   * ```ts
   * const handle = olli(graph, container);
   * ```
   */
  ```

- Mark internal helpers with `@internal` to exclude them even if exported.
- Prefer TSDoc tags `@param`, `@returns`, `@throws`, `@deprecated` over prose.

### What gets included

`scripts/build-typedoc.ts` runs typedoc with `--excludeInternal --excludePrivate --excludeProtected`. The entry point for each package is `packages/<pkg>/src/index.ts`. Anything re-exported there appears in `/api/<pkg>/`.

To add a new package to the reference, add an entry to `PACKAGES` in `scripts/build-typedoc.ts` with its group (`Public API`, `Domains`, or `Internals`).

### Regenerating

The dev and build scripts regenerate `api/` automatically. If you only want a fresh reference without restarting the server:

```bash
pnpm --filter docs build:api
```

VitePress will pick up the new markdown on its next reload.

## Deployment

Phase 7 (deploy & cutover) adds a GitHub Action that runs `pnpm --filter docs build` and pushes `.vitepress/dist/` to `gh-pages`. Until then, deploys are manual.
