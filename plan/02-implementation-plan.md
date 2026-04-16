# Olli (Solid rewrite) — Phased Implementation Plan

This is a sequenced work plan for executing the rewrite. Each phase is self-contained: a goal, the deliverables, the files to create, dependencies on previous phases, and acceptance criteria stated as testable behaviors. Hand Claude Code one phase at a time.

The architecture document (`01-architecture.md`) is the design reference. The pulley acceptance spec (`03-pulley-acceptance.md`) is the validation case for Phase 4 and beyond.

---

## Conventions

- All work happens inside `packages/olli-solid/` in the existing repository.
- Package manager: **pnpm** with workspaces. The root `pnpm-workspace.yaml` lists `packages/olli-solid/packages/*`.
- TypeScript strict mode everywhere. Shared `tsconfig.base.json` at `packages/olli-solid/`; per-package `tsconfig.json` extends it.
- Testing: **Vitest** for units, **`@solidjs/testing-library`** for components.
- No code from the existing `packages/core/`, `packages/adapters/` is reused directly. Borrowing logic by reading the old code is fine; importing it is not.
- Each phase ends with passing tests for that phase's acceptance criteria.

---

## Phase 0 — Repo scaffolding

**Goal:** Establish the monorepo structure, tooling, and CI scaffolding so subsequent phases have somewhere to land.

**Deliverables:**
- `packages/olli-solid/` directory.
- `packages/olli-solid/pnpm-workspace.yaml` listing `packages/*`.
- `packages/olli-solid/package.json` (workspace root, private).
- `packages/olli-solid/tsconfig.base.json` with strict TypeScript settings.
- Empty package directories for: `olli-core`, `olli-render-solid`, `olli-vis`, `olli-diagram`, `olli-adapters`, `olli`. Each has a stub `package.json` and `tsconfig.json` extending the base.
- Vitest configured at the workspace root, with per-package test discovery.
- A top-level `pnpm test` and `pnpm build` that run across all packages.
- A lightweight import-boundary check (e.g., a script or eslint rule) that fails CI if a package imports from a higher layer than it should.

**Dependencies:** none.

**Acceptance criteria:**
- `pnpm install` from `packages/olli-solid/` succeeds.
- `pnpm test` and `pnpm build` succeed (with no real tests yet — empty workspace passes).
- A deliberate import-boundary violation (e.g., `olli-core` importing from `olli-render-solid`) is rejected by CI tooling.

---

## Phase 1 — L0 Hypergraph and L1 Navigation runtime (no descriptions, no rendering)

**Goal:** Build the core data model and reactive navigation runtime. At the end of this phase, you can construct a hypergraph in code, instantiate a runtime, and programmatically move focus around — without any UI.

**Package:** `olli-core`.

**Deliverables:**

`src/hypergraph/`:
- `types.ts`: `HyperedgeId`, `Hyperedge<P>`, `Hypergraph<P>`.
- `build.ts`: `buildHypergraph(edges: Hyperedge[])` with referential integrity checks, parents/children consistency, cycle detection.
- `traversal.ts`: `descendants`, `ancestors`, `neighbors`, `isLeaf`.
- `ids.ts`: deterministic ID generator helpers.
- `index.ts`: barrel.

`src/predicate/`:
- `types.ts`: minimal vendored `LogicalComposition`, `FieldPredicate`, `LogicalAnd`, `LogicalOr`, `LogicalNot` from vega-lite. Drop the vega-lite dependency.
- `eval.ts`: `selectionTest(data, predicate)` equivalent to current Olli's.
- `index.ts`: barrel.

`src/runtime/`:
- `navtree.ts`: navigation tree synthesis algorithm per `01-architecture.md` §11.1 and §11.2. Defines `NavNode`, `NavTree`, `NavNodeId`, the synthesis function, and the virtual parent-context node logic.
- `runtime.ts`: `NavigationRuntime<P>` implementation backed by Solid signals. Exposes `hypergraph`, `focusedNavId`, `selection`, `expanded`, `navTree` as accessors; `focus`, `moveFocus`, `expand`, `collapse`, `setSelection` as actions. Plugin registries: `registerKeybinding`, `registerDialog`, `registerPredicateProvider`.
- `keybindings.ts`: keybinding registry data structures (no UI wiring yet).
- `dialogs.ts`: dialog registry data structures.
- `predicates.ts`: predicate provider registry, `fullPredicate(navId)` computation per §11.3.
- `index.ts`: barrel.

`src/index.ts`: top-level barrel exporting hypergraph, predicate, and runtime APIs.

**Tests** (`olli-core/src/**/*.test.ts`):
- Hypergraph build/validation: rejects dangling references, mismatched parents/children, cycles.
- Traversal: `descendants`, `ancestors`, `neighbors` return expected sets on small fixtures.
- Nav tree synthesis on a simple tree (single-parent throughout): produces a tree isomorphic to the hypergraph.
- Nav tree synthesis on a hypergraph with one multi-parent node: the node appears once per parent path; ascending from each occurrence produces a virtual parent-context NavNode whose default child is the parent that was descended through.
- `moveFocus` semantics: arrows move focus correctly under all four directions in both single- and multi-parent cases.
- Selection: `setSelection` updates `selection` accessor; `fullPredicate(navId)` reflects ancestor predicate contributions.
- Reactivity: subscribers to `focusedNavId` fire when `focus()` is called; subscribers to `navTree` fire when the hypergraph is replaced.

**Dependencies:** Phase 0.

**Acceptance criteria:**
- All tests pass.
- A hand-authored hypergraph (use a small subset of the pulley — say 5 hyperedges with one multi-parent node) can be loaded into the runtime, focus can be moved with `moveFocus`, and the focused NavNode's path matches expectations including correct virtual-parent synthesis.
- No imports from L2, L3, L4, or L5.
- No DOM, no Solid rendering — only Solid signals.

---

## Phase 2 — L2 Description framework

**Goal:** Add the token registry, customization recipes, and reactive `describe()` so each NavNode produces a string description that updates when its inputs change.

**Package:** `olli-core` (extends Phase 1).

**Deliverables:**

`src/description/`:
- `tokens.ts`: token registry; `DescriptionToken<P>`, `TokenContext<P>`, `TokenValue` types; built-in generic tokens (`name`, `index`, `level`, `parent`, `children`, `parentContexts`).
- `customization.ts`: `Customization`, `RecipeEntry`, `CustomizationStore`; default recipes; preset registration and application.
- `describe.ts`: `describe(navId): Accessor<string>` that composes token catalog + active recipe.
- `index.ts`: barrel.

The runtime gains a method `getDescriptionFor(navId)` that returns the reactive description accessor. The customization store is owned by the runtime and exposed via the runtime's API.

**Tests:**
- Token catalog correctness: each generic token's `compute` returns expected `short` and `long` for various NavNode contexts.
- Recipe application: changing a recipe (toggling presence, reordering, switching brevity) changes the rendered description string.
- Reactivity: `describe(navId)` accessor fires when selection, customization, or hypergraph changes.
- Virtual parent-context node: the `parentContexts` token names the alternate parents and identifies the default.

**Dependencies:** Phase 1.

**Acceptance criteria:**
- The hand-authored hypergraph from Phase 1 produces sensible descriptions for each NavNode using only generic tokens.
- Toggling presence of a token updates the description without rebuilding the runtime.
- Switching customization preset (when one is defined) updates all affected NavNode descriptions.

---

## Phase 3 — L3 Solid renderer (minimal)

**Goal:** Render a NavigationRuntime as an accessible HTML tree view. At the end of this phase, you can mount the pulley hypergraph (or any hypergraph) into a DOM container and navigate it with arrow keys.

**Package:** `olli-render-solid`.

**Deliverables:**

`src/`:
- `TreeView.tsx`: root container, `role="tree"`, listens for keydown events at the container level and dispatches to the runtime's keybinding registry.
- `TreeItem.tsx`: recursive component; emits `<li role="treeitem">` with proper ARIA attributes (`aria-expanded`, `aria-selected`, `aria-level`, `aria-setsize`, `aria-posinset`, `tabindex`).
- `NodeLabel.tsx`: renders `describe(navId)` as the visible/announced label.
- `Dialog.tsx`: focus-trapping modal primitive; handles `Escape`.
- `mount.tsx`: `mount(runtime, container, options?)` — sets up reactive root, renders `<TreeView>`.
- `styles.css`: minimal styling, ARIA-correct visibility (collapsed children must be hidden from AT and visually).
- `index.ts`: barrel.

The renderer attaches the core keybindings (arrow keys → `moveFocus`, Enter → expand/collapse) by registering them with the runtime's keybinding registry. Domain-specific keybindings (registered later) layer on top.

For Phase 3, skip `SettingsMenu` and `CommandBox` — those come in Phase 5 with `olli-vis`.

**Tests** (using `@solidjs/testing-library`):
- A small hypergraph mounts and produces the expected ARIA tree structure.
- Arrow key events move focus and update `aria-selected`.
- Multi-parent hyperedge: descending into one parent shows the multi-parent node as a child; pressing up from it focuses a virtual parent-context node whose label includes the parent options.
- Selection updates trigger NodeLabel re-renders; unrelated nodes do not re-render (verify via Solid's tracking, e.g., a render counter).

**Dependencies:** Phases 1, 2.

**Acceptance criteria:**
- A test page (in `examples/` or `apps/playground`) loads a hand-authored hypergraph and renders an interactive tree view.
- Keyboard navigation works: arrows move focus, Enter expands/collapses.
- The DOM tree matches WAI-ARIA tree-view recommendations (verify against axe-core if available).

---

## Phase 4 — L4 olli-diagram + pulley validation

**Goal:** Implement the diagram domain end-to-end with the medium pulley as the validation case. This phase is the architectural acceptance test: if the pulley works without `olli-vis` in the dependency graph, the layering is correct.

**Package:** `olli-diagram`.

**Deliverables:**

`src/spec/types.ts`:
- `DiagramSpec`: `{ edges: Hyperedge<DiagramPayload>[] }` — direct hyperedge authoring for now.
- `DiagramPayload`: optional metadata (initially empty/unused; placeholder for future).

`src/lower/lower.ts`:
- `lowerDiagramSpec(spec: DiagramSpec): Hypergraph<DiagramPayload>`. Calls `buildHypergraph` from `olli-core`.

`src/domain.ts`:
- An `OlliDomain<DiagramSpec, DiagramPayload>` instance that:
  - Wires `toHypergraph` to the lowerer.
  - Registers no keybindings, no dialogs, no predicate providers.
  - Registers no domain-specific tokens (rely on generics from L2).

`src/examples/pulleyMedium.ts`:
- The full medium pulley hypergraph from Benthic, transcribed as a `DiagramSpec`. Hyperedge IDs and structure match `03-pulley-acceptance.md` exactly.

`src/index.ts`: barrel exporting the domain, the spec types, the lowerer, and the pulley example.

**Tests:**
- Lowering correctness: the pulley spec lowers to a valid hypergraph (passes `buildHypergraph` checks).
- Multi-parent count: at least one hyperedge has 3 parents; verify it (Floor, parents [0, 24, 25]).
- Navigation acceptance traces from `03-pulley-acceptance.md` execute correctly against a runtime built from the pulley.

**Validation app:**
- A standalone example in `examples/pulley-medium/` that mounts the pulley diagram with `olli-render-solid` and `olli-diagram` only. **Do not** import `olli-vis`. If the example builds and runs without it, the layering is verified.

**Dependencies:** Phases 1, 2, 3.

**Acceptance criteria:**
- The pulley example renders and navigates per `03-pulley-acceptance.md` traces.
- `olli-diagram` does not depend on `olli-vis` (verified by inspecting `package.json` dependencies and the import-boundary check).
- All acceptance traces in `03-pulley-acceptance.md` pass as automated tests.

**Decision point:** during this phase, if generic L2 tokens are insufficient for clear pulley descriptions, we add a minimal `relationship` role and any necessary domain tokens. Do not over-engineer; add only what's needed to make the acceptance traces read naturally.

---

## Phase 5 — L4 olli-vis

**Goal:** Bring the visualization domain online with full feature parity: tokens, presets, dialogs, keybindings, and the OlliVisSpec authoring surface.

**Package:** `olli-vis`.

**Deliverables:**

`src/spec/types.ts`:
- `OlliVisSpec` (replacing `OlliSpec`), `UnitOlliVisSpec` (replacing `UnitOlliSpec`), `MultiOlliVisSpec` (replacing `MultiOlliSpec`).
- `OlliNode`, `OlliGroupNode`, `OlliPredicateNode`, `OlliAnnotationNode` — the declarative authoring tree.
- `OlliFieldDef`, `OlliAxis`, `OlliLegend`, `OlliGuide`, `OlliMark`, `OlliDataset`, `OlliDatum`, `OlliValue`, `MeasureType`, `OlliTimeUnit`.
- `VisPayload`: payload type for hyperedges in this domain.

`src/lower/`:
- `lower.ts`: `lowerVisSpec(spec: OlliVisSpec): Hypergraph<VisPayload>`. Walks the `OlliNode[]` declarative tree and produces hyperedges. Roles assigned based on tree position and viz semantics: `root`, `view`, `xAxis`/`yAxis`/`legend`/`guide` for guide-level groupbys, `filteredData` for predicate leaves, `annotations`. Each hyperedge's payload carries its `predicate` (for predicate nodes) or `groupby` (for group nodes), plus `specIndex` for multi-spec.
- `infer.ts`: `inferStructure(spec: OlliVisSpec): OlliNode[]` — port of the current `inferStructure` logic.

`src/tokens/`:
- `aggregate.ts`: average/min/max for the current selection on a numeric field.
- `quartile.ts`: which quartile this section falls into vs. siblings.
- `data.ts`: data values for a leaf row; range/extent for a continuous group.
- Viz-aware overrides:
  - `name.ts`: knows about chart type, axis titles, etc.
  - `parent.ts`: knows that the parent of an axis interval is "the X-axis," etc.
- `index.ts`: registers all viz tokens.

`src/dialogs/`:
- `table.tsx`: table view for a `filteredData` node, triggered by `t`.
- `filter.tsx`: selection menu, triggered by `f`. Updates `runtime.setSelection`.
- `targetedNav.tsx`: jump-to-node menu, triggered by `j`.

`src/keybindings/xy.ts`: `x` jumps to first xAxis node, `y` to first yAxis node.

`src/presets/`:
- `high.ts`, `medium.ts`, `low.ts`: the CHI '24 customization presets, per-role token recipes.
- `index.ts`: registers all presets.

`src/domain.ts`: an `OlliDomain<OlliVisSpec, VisPayload>` wiring all the above.

`src/index.ts`: barrel.

**Tests:**
- Lowering correctness: a simple bar chart spec produces the expected hypergraph (axis hyperedges, intervals, leaf data nodes).
- Multi-spec lowering: a layered or concat spec produces multiple view subtrees.
- Token outputs: `aggregate` on a numeric field gives correct average/min/max; `quartile` correctly bins.
- Predicate provider: descending into an axis interval narrows `fullPredicate` to that interval's range.
- Dialogs: `t` opens the table dialog showing rows matching the current `fullPredicate`.
- Keybindings: `x` and `y` jump correctly.
- Presets: applying high/medium/low changes descriptions to match expected outputs from CHI '24 figures.

**Dependencies:** Phases 1, 2, 3.

**Acceptance criteria:**
- A hand-authored `OlliVisSpec` for a faceted bar chart renders and navigates correctly.
- Tokens, dialogs, and keybindings all work as in current Olli.
- The CHI '24 high/medium/low presets produce descriptions consistent with the published examples (within reason — exact wording can drift, structure should not).

---

## Phase 6 — L5 Adapters

**Goal:** Port Vega, Vega-Lite, and Observable Plot adapters to emit the new `OlliVisSpec`.

**Package:** `olli-adapters`.

**Deliverables:**

Direct ports of the existing adapters in `packages/adapters/src/` to:
- `src/VegaAdapter.ts`
- `src/VegaLiteAdapter.ts`
- `src/ObservablePlotAdapter.ts`
- `src/utils.ts` (shared helpers)
- `src/index.ts`

Renames: `UnitOlliSpec` → `UnitOlliVisSpec`, `OlliVisSpec` from old → `OlliVisSpec` from new, etc. Otherwise the adapter logic is preserved.

**Tests:**
- Each adapter, given a sample input from the existing `examples/` data, produces an `OlliVisSpec` that lowers cleanly and renders correctly.

**Dependencies:** Phase 5.

**Acceptance criteria:**
- All three adapters work end-to-end with `olli-vis` and `olli-render-solid`.
- The existing example visualizations from current Olli (port a representative subset) render and are navigable.

---

## Phase 7 — `olli-js` consumer wrapper

**Goal:** Build the vanilla-JS wrapper that exposes an imperative API around the Solid stack. This is the default consumer entry point — what downstream users install and import.

**Package:** `olli-js`.

**Deliverables:**

`src/handle.ts`:
- `OlliHandle` interface and implementation per `01-architecture.md` §12.1.
- `OlliOptions` interface.
- The handle wraps a `NavigationRuntime<P>` and exposes its accessors as imperative getter methods.

`src/bridge.ts`:
- `bridgeSignal<T>(read: () => T, cb: (value: T) => void): () => void` — bridges a Solid accessor to a callback subscription, returning an unsubscribe function. Internally uses `createRoot` and `createEffect`.
- Possibly other small utilities for managing reactive lifetimes from imperative code.

`src/olliVis.ts`:
- `olliVis(spec: OlliVisSpec, container: HTMLElement, options?: OlliOptions): OlliHandle`.
- Sets up a Solid root via `createRoot`, calls `mount` from `olli-render-solid` with the vis domain, builds and returns an `OlliHandle`.
- Also exported as `olli` (the conventional name for the vis case).

`src/olliDiagram.ts`:
- `olliDiagram(spec: DiagramSpec, container: HTMLElement, options?: OlliOptions): OlliHandle`.
- Same structure, diagram domain.

`src/index.ts`:
- Re-exports `olli`, `olliVis`, `olliDiagram`, and `OlliHandle`/`OlliOptions` types.
- Re-exports adapters from `olli-adapters`: `VegaAdapter`, `VegaLiteAdapter`, `ObservablePlotAdapter`.
- Re-exports public spec types: `OlliVisSpec`, `OlliNode`, `OlliFieldDef`, `DiagramSpec`, `Selection`, `Customization`, `NavNodeId`.

`package.json`:
- Lists `olli-render-solid`, `olli-vis`, `olli-diagram`, `olli-adapters`, `olli-core`, and `solid-js` as **regular** (not peer) dependencies. Consumers should not see Solid in their dep graph.
- Bundling configuration ensures `solid-js` is bundled into the published artifact (so consumers don't need to install it).

**Tests:**
- Mount a vis spec via `olli()`, verify the returned handle's imperative methods (focus, getFocusedNavId, setSelection, getSelection, getDescription) work and stay synchronized with DOM state.
- Mount a diagram spec via `olliDiagram()`, run a subset of the pulley acceptance traces using only handle methods (no Solid imports in the test).
- `onFocusChange` callback fires when focus changes; the returned unsubscribe function stops further callbacks.
- `destroy()` removes the rendered DOM and disposes the Solid root (verify no leaked effects via Solid's dev-time warnings or by mounting/destroying many times in a tight loop).
- Customization round-trip: `setCustomization` followed by `getDescription` reflects the change.

**Dependencies:** Phases 4, 5, 6.

**Acceptance criteria:**
- A consumer test (in `examples/vanilla-js/`) imports only from `olli-js` (no `solid-js` import in the consumer code), mounts a chart, navigates programmatically via the handle, and tears down cleanly.
- The bundle size of `olli-js` is documented; the published artifact includes Solid bundled in (consumers see one dependency, not many).
- No public API requires the consumer to know about Solid signals, accessors, effects, or roots.

**Naming note:** The directory and internal package name is `olli-js`. The npm-published name is a separate decision (could be `olli` to replace the existing package, or `olli-js`, or both as aliases). Defer this to publishing time.

---

## Phase 8 — Documentation and examples

**Goal:** Replace the old README content with up-to-date docs reflecting the new architecture, and ship working examples for both vis and diagram domains.

**Deliverables:**
- `packages/olli-solid/README.md`: top-level overview, philosophy, links to examples.
- Per-package `README.md` files describing each layer's responsibilities.
- `examples/bar-chart/`: a Vega-Lite bar chart consumed via `olli-js` (vanilla JS, no Solid imports in consumer code).
- `examples/pulley-medium/`: the diagram example from Phase 4, consumed via `olli-js` using `olliDiagram`.
- `examples/solid-app/`: a small Solid app that bypasses `olli-js` and embeds `olli-render-solid` components directly, demonstrating the lower-level integration path.
- `apps/playground/`: a dev-time browser app that lets you swap between examples.

**Dependencies:** Phases 1–7.

**Acceptance criteria:**
- A new contributor can read the docs, run an example, and understand the package boundaries.

---

## Out-of-scope for this rewrite (future phases)

- **`olli-map` domain**: geographic feature-based map navigation.
- **Adapter for new diagram libraries** (e.g., Bluefish, mermaid).
- **Sonification, braille, tactile output channels**: the description framework's separation of token catalog from rendering should make these tractable, but they require their own design work.

---

## Phase ordering notes

- Phases 1, 2, 3 are strictly sequential: each builds on the previous in `olli-core` and `olli-render-solid`.
- Phases 4 and 5 are independent of each other and can be done in parallel by separate Claude Code sessions, but Phase 4 (pulley diagram) is the architectural acceptance test and should ideally land first to catch boundary violations.
- Phase 6 (adapters) depends on Phase 5 (`olli-vis`).
- Phase 7 (`olli-js` wrapper) depends on Phases 4, 5, and 6 since it composes all three domains plus adapters into the consumer surface.
- Phase 8 wraps up.

If priorities change, Phase 4 (the pulley) is the highest-leverage early validation: it proves the architecture supports non-vis domains before we invest in porting all the vis machinery.
