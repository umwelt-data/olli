# Olli (Solid rewrite) — Pulley Acceptance Spec

This document specifies the diagram-domain validation case: the medium pulley diagram from Cheng (1999), as used in the Benthic user study (Mei & Pollock et al., ASSETS '25). It serves three purposes:

1. **Acceptance test for the architecture.** If `olli-render-solid` + `olli-core` + `olli-diagram` can navigate this hypergraph correctly without `olli-vis` in the dependency graph, the layering is sound.
2. **Concrete example** that the rewrite supports non-visualization domains.
3. **Source of truth** for the navigation behavior expected when a hyperedge has multiple parents (the virtual parent-context node UX).

This is Phase 4 of the implementation plan.

---

## 1. The diagram

Cheng's medium pulley system: three pulleys (A, B, C), seven ropes (p, q, r, s, t, u, v), two boxes (B1, B2), plus the ceiling and floor. The defining feature of "medium" complexity is that the rope of one pulley supports the next pulley — rope `r` is part of Pulley System A but also supports Pulley B; rope `t` is part of Pulley System B but also supports Pulley C.

Reference: Figure 7(b) in `benthic.pdf`.

## 2. The hypergraph

Transcribed verbatim from the Benthic prototype (`benthic-5/src/input-pulley-medium.ts`). All hyperedges:

| ID | Display Name | Description | Parents | Children |
|----|---|---|---|---|
| 0 | Pulley diagram | A mechanical system consisting of pulleys, ropes, and boxes. | — | 1, 2, 3, 4, 5, 6, 7, 18, 19, 20, 21, 22, 23, 24, 25 |
| 1 | Pulley System A | Contains 3 objects. | 0 | 12, 8, 13 |
| 2 | Pulley System B | Contains 3 objects. | 0 | 14, 9, 15 |
| 3 | Pulley System C | Contains 3 objects. | 0 | 16, 10, 17 |
| 4 | Box B1 | Weight of 4 units. | 0, 18 | — |
| 5 | Box B2 | — | 0, 23 | — |
| 6 | Ceiling | — | 0, 20 | — |
| 7 | Floor | — | 0, 24, 25 | — |
| 8 | Pulley A | — | 1, 19 | — |
| 9 | Pulley B | — | 2, 21 | — |
| 10 | Pulley C | — | 3, 22 | — |
| 11 | Rope p | — | 19, 20 | — |
| 12 | Rope q | — | 1, 18 | — |
| 13 | Rope r | — | 1, 21 | — |
| 14 | Rope s | — | 2, 24 | — |
| 15 | Rope t | — | 2, 22 | — |
| 16 | Rope u | — | 3, 25 | — |
| 17 | Rope v | — | 3, 23 | — |
| 18 | Box B1 hangs from Rope q | Contains 2 objects. | 0 | 4, 12 |
| 19 | Pulley A hangs from Rope p | Contains 2 objects. | 0 | 8, 11 |
| 20 | Rope p hangs from Ceiling | Contains 2 objects. | 0 | 6, 11 |
| 21 | Pulley B hangs from Rope r | Contains 2 objects. | 0 | 9, 13 |
| 22 | Pulley C hangs from Rope t | Contains 2 objects. | 0 | 10, 15 |
| 23 | Box B2 hangs from Rope v | Contains 2 objects. | 0 | 5, 17 |
| 24 | Rope s is anchored to Floor | Contains 2 objects. | 0 | 14, 7 |
| 25 | Rope u is anchored to Floor | Contains 2 objects. | 0 | 16, 7 |

This is the canonical input for `olli-diagram/examples/pulleyMedium.ts`. IDs are strings to match the source format.

## 3. Structural properties this exercises

- **Multi-parent hyperedges** (the central hypergraph affordance): every leaf object except the root has multiple parents. Floor (7) has three parents. Box B1, Box B2, Ceiling, Pulley A, Pulley B, Pulley C, and every Rope each has two.
- **Cross-system structural sharing**: rope `r` (13) is a child of both Pulley System A and "Pulley B hangs from Rope r" — this is the medium-difficulty cue that one system supports another.
- **No underlying tabular dataset**: no `OlliDataset`, no field predicates, no selection. This pressure-tests that core treats data binding as optional.
- **No domain-specific dialogs or keybindings**: `olli-diagram` registers nothing beyond the lowerer. Tokens are entirely the L2 generics. If the descriptions read awkwardly, that's a signal that the generic tokens need refinement (or that one diagram-specific token is justified).
- **Layering test**: the example must build with only `olli-core`, `olli-render-solid`, and `olli-diagram` in its dependency tree. `olli-vis` and `olli-adapters` are not imported. CI must verify this.

## 4. Acceptance traces

These are user journeys through the diagram, with the expected NavNode focus path and (paraphrased) descriptions at each step. The rendered descriptions need not match these strings verbatim — what matters is the focus path and that descriptions correctly identify the focused node and its context.

In the focus path notation, NavNodeIds are `/`-joined hyperedge IDs from root, with `^` denoting a virtual parent-context node.

### Trace A — Single-parent descent and ascent (no virtual node)

Starting at root, descend into Pulley System A and back out.

| Step | Action | Focus NavId | Description should mention |
|---|---|---|---|
| 1 | Initial | `0` | "Pulley diagram", child count |
| 2 | Down | `0/1` | "Pulley System A", "1 of 15", contains 3 objects |
| 3 | Down | `0/1/12` | "Rope q", parent is Pulley System A, "1 of 3" |
| 4 | Up | `0/1` | "Pulley System A" |
| 5 | Up | `0` | "Pulley diagram" |

This trace contains no multi-parent ascents. It must behave identically to current Olli's tree navigation.

### Trace B — Multi-parent ascent introduces virtual parent-context node

Box B1 has two parents: 0 (root) and 18 ("Box B1 hangs from Rope q"). Reach it via 18, then ascend.

| Step | Action | Focus NavId | Description should mention |
|---|---|---|---|
| 1 | Initial | `0` | "Pulley diagram" |
| 2 | Down, Right ×17 (to edge 18) | `0/18` | "Box B1 hangs from Rope q", contains 2 objects |
| 3 | Down | `0/18/4` | "Box B1", weight of 4 units, parent is the hangs relationship |
| 4 | Up | `0/18/4/^` | **Virtual parent-context node**: "Parent contexts for Box B1. 2 options. Default: Box B1 hangs from Rope q." |
| 5 | Up (commit default) | `0/18` | "Box B1 hangs from Rope q" |

At step 4, arrows left/right cycle through the two parent options ("Box B1 hangs from Rope q", "Pulley diagram"). Pressing Enter or Up on the highlighted option commits and ascends to it.

If at step 4 the user arrows right and then presses Up:

| Step | Action | Focus NavId | Description should mention |
|---|---|---|---|
| 4a | (continuing from step 4) Right | `0/18/4/^` (selection moved to "Pulley diagram" option) | The virtual node now indicates "Pulley diagram" is selected |
| 4b | Up | `0` | "Pulley diagram" |

This is the architecturally important behavior: the virtual node lets the user pick a parent context when ascending, and the choice updates the path.

### Trace C — Triple-parent ascent (Floor)

Floor (7) has three parents. Reach Floor via "Rope s is anchored to Floor" (24), then ascend.

| Step | Action | Focus NavId | Description should mention |
|---|---|---|---|
| 1 | Initial | `0` | "Pulley diagram" |
| 2 | Navigate to edge 24 | `0/24` | "Rope s is anchored to Floor" |
| 3 | Down, Right (to Floor) | `0/24/7` | "Floor" |
| 4 | Up | `0/24/7/^` | **Virtual node**: "Parent contexts for Floor. 3 options. Default: Rope s is anchored to Floor. Other options: Rope u is anchored to Floor, Pulley diagram." |
| 5 | Up (commit default) | `0/24` | "Rope s is anchored to Floor" |

The virtual node must correctly enumerate all three parents and identify the default based on the descent path.

### Trace D — Cross-system structural insight (Rope r)

Rope r (13) is the architecturally interesting hyperedge: it's a child of both Pulley System A (1) and "Pulley B hangs from Rope r" (21). A user navigating Pulley System A can discover that one of its ropes also supports Pulley B by ascending and switching parent contexts.

| Step | Action | Focus NavId | Description should mention |
|---|---|---|---|
| 1 | Initial | `0` | "Pulley diagram" |
| 2 | Down (to System A) | `0/1` | "Pulley System A" |
| 3 | Down, Right ×2 | `0/1/13` | "Rope r", parent is Pulley System A |
| 4 | Up | `0/1/13/^` | **Virtual node**: "Parent contexts for Rope r. 2 options. Default: Pulley System A. Other option: Pulley B hangs from Rope r." |
| 5 | Right | `0/1/13/^` (selection on "Pulley B hangs from Rope r") | Virtual node indicates new selection |
| 6 | Up | `0/21` | "Pulley B hangs from Rope r" |
| 7 | Down, Right | `0/21/9` | "Pulley B" |

This trace demonstrates the central perceptual-congruence claim of Benthic: the diagram's overlapping structure is preserved in navigation, and a user can fluidly cross from one grouping to another through shared elements without backing all the way out to the root.

### Trace E — `h` "home" key (recover focus)

Optional Phase 4 feature, mirroring Benthic's `h` keybinding. If implemented, pressing `h` from any focus state reasserts focus on the current NavNode (useful when a screen reader has wandered off in DOM-related ways). This is a renderer-level concern; if it's not in the core keybinding set in Phase 3, defer.

## 5. Edge cases the implementation must handle

- **Up from root**: pressing Up when focused on a real root NavNode does nothing (no parent).
- **Up from a virtual parent-context node**: pressing Up does nothing (or commits the current selection — pick one and document; recommended behavior is **commit and ascend to highlighted parent**, identical to pressing Enter).
- **Left/Right on a virtual node**: cycles through parent options (not through siblings of the original child — the virtual node is its own scope).
- **Down on a virtual node**: ambiguous; treat as no-op or as "commit to highlighted and descend back to the original child via the new path." Recommend **no-op** to keep semantics simple.
- **Repeated multi-parent ascents**: if the user ascends through a virtual node, lands on a parent that itself has multiple parents, and ascends again, a second virtual node appears. Behavior is recursive.
- **Same hyperedge appearing under multiple parents in render**: the runtime synthesizes distinct NavNodes for each occurrence. The rendered DOM shows the hyperedge under each parent independently, with distinct DOM nodes. Description rendering should be identical for each occurrence (same hyperedge, same generic tokens), but `fullPredicate` may differ if predicates are involved (not the case for the pulley).

## 6. Acceptance criteria summary

The pulley acceptance phase passes when:

1. The hypergraph in Section 2 is loaded from `olli-diagram/examples/pulleyMedium.ts` and renders in `olli-render-solid` with no `olli-vis` dependency.
2. Traces A–D execute correctly as automated tests, with focus paths matching exactly and descriptions covering the indicated content.
3. The DOM passes basic ARIA tree-view validation (correct roles, levels, expanded states).
4. A blind user (or sighted reviewer using a screen reader) can read the architecture document and the trace specs and verify the system behaves as described — not as a formal study, just as a sanity check.
5. The `package.json` of the pulley example lists only `olli-core`, `olli-render-solid`, and `olli-diagram` as runtime dependencies (plus Solid itself). The import-boundary check (Phase 0) confirms no rogue imports.

## 7. What the pulley case proves about the architecture

If all acceptance criteria pass:

- Hypergraphs are the right core data model — multi-parent structure works through navigation cleanly.
- The virtual parent-context node UX preserves Olli's tree-shaped mental model while accommodating hypergraph affordances.
- The L0–L3 stack is genuinely domain-agnostic: no visualization concepts leak through.
- A new domain can be added by registering a thin module — no core changes required.
- The Solid reactivity story works: descriptions update without explicit rebuild calls; only affected nodes re-render.

If any of those don't pass, the architecture needs revision before continuing to Phase 5.
