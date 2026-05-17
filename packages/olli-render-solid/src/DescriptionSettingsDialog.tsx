import { For, Show, createSignal, createMemo } from 'solid-js';
import { parseInlineCode } from './NodeLabel';
import type {
  DialogContribution,
  DialogRenderResult,
  NavigationRuntime,
  NavNode,
  Customization,
  RecipeEntry,
  Brevity,
  JoinHint,
} from 'olli-core';
import { isTokenApplicable, assembleParts } from 'olli-core';

interface TokenFormEntry {
  token: string;
  included: boolean;
  brevity: Brevity;
}

export interface DescriptionSettingsConfig {
  roles: ReadonlyArray<{ value: string; label: string }>;
  defaultPreset?: string;
  tokenLabels?: Record<string, string>;
  tokenDescriptions?: Record<string, string>;
  roleForNode: (runtime: NavigationRuntime<any>, navNode: NavNode) => string;
}

const CORE_TOKEN_LABELS: Record<string, string> = {
  name: 'Name',
  index: 'Position',
  level: 'Depth level',
  parent: 'Parent',
  children: 'Children',
  parentContext: 'Groupings',
};

const CORE_TOKEN_DESCRIPTIONS: Record<string, string> = {
  name: 'Title or label of this element',
  index: 'Position among siblings (e.g., 1 of 5)',
  level: 'Depth in the navigation tree',
  parent: 'Name of the parent element',
  children: 'Number and names of child elements',
  parentContext: 'Groupings this element belongs to',
};

function tokenLabel(name: string, labels?: Record<string, string>): string {
  return labels?.[name] ?? CORE_TOKEN_LABELS[name] ?? name;
}

function tokenDescription(name: string, descriptions?: Record<string, string>): string | undefined {
  return descriptions?.[name] ?? CORE_TOKEN_DESCRIPTIONS[name];
}

type PresetChoice = string | 'custom';

function detectPreset(
  presets: ReadonlyArray<{ name: string; customizations: readonly Customization[] }>,
  role: string,
  entries: TokenFormEntry[],
): PresetChoice {
  const availableTokens = new Set(entries.map((e) => e.token));
  for (const preset of presets) {
    const presetForRole = preset.customizations.find((c) => c.role === role);
    if (!presetForRole) continue;
    const relevantRecipe = presetForRole.recipe.filter((e) => availableTokens.has(e.token));
    const included = entries.filter((e) => e.included);
    if (included.length !== relevantRecipe.length) continue;
    const matches = included.every(
      (e, i) =>
        e.token === relevantRecipe[i]?.token &&
        e.brevity === relevantRecipe[i]?.brevity,
    );
    if (matches) return preset.name;
  }
  return 'custom';
}

function buildFormEntries<P>(
  runtime: NavigationRuntime<P>,
  role: string,
  navNode: NavNode,
): TokenFormEntry[] {
  const active = runtime.customization.activeFor(role)();
  const applicableTokens = runtime.tokens.applicableTo(role);
  const recipeMap = new Map(active.recipe.map((e) => [e.token, e.brevity]));

  const edge = navNode.hyperedgeId
    ? runtime.hypergraph().edges.get(navNode.hyperedgeId)
    : undefined;
  const ctx = {
    navNode,
    edge: edge ?? null,
    hypergraph: runtime.hypergraph(),
    runtime,
    selection: runtime.selection(),
    fullPredicate: runtime.fullPredicate(navNode.navId),
  };

  const hasOutput = (tokenName: string): boolean => {
    const token = runtime.tokens.byName(tokenName);
    if (!token) return false;
    const value = token.compute(ctx);
    return value.short !== '' || value.long !== '';
  };

  const entries: TokenFormEntry[] = [];
  for (const entry of active.recipe) {
    const token = runtime.tokens.byName(entry.token);
    if (token && isTokenApplicable(token, role) && hasOutput(entry.token)) {
      entries.push({ token: entry.token, included: true, brevity: entry.brevity });
    }
  }
  for (const token of applicableTokens) {
    if (!recipeMap.has(token.name) && hasOutput(token.name)) {
      entries.push({ token: token.name, included: false, brevity: 'short' });
    }
  }
  return entries;
}

function computePreview<P>(
  runtime: NavigationRuntime<P>,
  navNode: NavNode,
  role: string,
  entries: TokenFormEntry[],
): string {
  const edge = navNode.hyperedgeId
    ? runtime.hypergraph().edges.get(navNode.hyperedgeId)
    : undefined;

  const ctx = {
    navNode,
    edge: edge ?? null,
    hypergraph: runtime.hypergraph(),
    runtime,
    selection: runtime.selection(),
    fullPredicate: runtime.fullPredicate(navNode.navId),
  };

  const parts: { text: string; joinHint: JoinHint }[] = [];
  for (const entry of entries) {
    if (!entry.included) continue;
    const token = runtime.tokens.byName(entry.token);
    if (!token || !isTokenApplicable(token, role)) continue;
    const value = token.compute(ctx);
    const text = entry.brevity === 'long' ? value.long : value.short;
    if (text) parts.push({ text, joinHint: value.joinHint ?? 'sentence' });
  }
  return assembleParts(parts);
}

function findNavNodeForRole<P>(runtime: NavigationRuntime<P>, role: string): NavNode | undefined {
  const navTree = runtime.navTree();
  for (const [, node] of navTree.byNavId) {
    if (node.hyperedgeId === null) continue;
    const edge = runtime.hypergraph().edges.get(node.hyperedgeId);
    if (edge?.role === role) return node;
  }
  return undefined;
}

export function descriptionSettingsDialog<P>(
  config: DescriptionSettingsConfig,
): DialogContribution<P> {
  return {
    id: 'descriptionSettings',
    label: 'description settings',
    triggerKey: 'd',
    render: (runtime: NavigationRuntime<P>, navNode: NavNode): DialogRenderResult => {
      const initialRole = config.roleForNode(runtime, navNode);
      const presentRoles = new Set<string>();
      for (const edge of runtime.hypergraph().edges.values()) {
        if (edge.role) presentRoles.add(edge.role);
      }
      const filteredRoles = config.roles.filter((r) => presentRoles.has(r.value));
      const presets = runtime.customization.listPresets();

      const initialEntries = buildFormEntries(runtime, initialRole, navNode);
      const entriesCache = new Map<string, TokenFormEntry[]>();
      entriesCache.set(initialRole, initialEntries);

      const [selectedRole, setSelectedRole] = createSignal(initialRole);
      const [entries, setEntries] = createSignal<TokenFormEntry[]>(initialEntries);
      const [preset, setPreset] = createSignal<PresetChoice>(
        detectPreset(presets, initialRole, initialEntries),
      );

      const nodeForRole = createMemo(() => {
        const role = selectedRole();
        if (role === initialRole) return navNode;
        return findNavNodeForRole(runtime, role) ?? navNode;
      });

      const preview = createMemo(() =>
        computePreview(runtime, nodeForRole(), selectedRole(), entries()),
      );

      const handleRoleChange = (role: string) => {
        entriesCache.set(selectedRole(), entries());
        setSelectedRole(role);
        if (!entriesCache.has(role)) {
          const repNode = role === initialRole ? navNode : (findNavNodeForRole(runtime, role) ?? navNode);
          entriesCache.set(role, buildFormEntries(runtime, role, repNode));
        }
        const loaded = entriesCache.get(role)!;
        setEntries(loaded);
        setPreset(detectPreset(presets, role, loaded));
      };

      const presetChoices = createMemo(() => [
        ...presets.map((p) => p.name),
        'custom',
      ]);

      const hasPresets = presets.length > 0;

      const handlePresetChange = (choice: PresetChoice) => {
        setPreset(choice);
        if (choice === 'custom') return;
        const role = selectedRole();
        const found = presets.find((p) => p.name === choice);
        if (!found) return;
        const presetForRole = found.customizations.find((c) => c.role === role);
        if (!presetForRole) return;

        const recipeMap = new Map(
          presetForRole.recipe.map((e) => [e.token, e.brevity]),
        );
        const applicableTokens = runtime.tokens.applicableTo(role);

        const currentNode = nodeForRole();
        const edge = currentNode.hyperedgeId
          ? runtime.hypergraph().edges.get(currentNode.hyperedgeId)
          : undefined;
        const ctx = {
          navNode: currentNode,
          edge: edge ?? null,
          hypergraph: runtime.hypergraph(),
          runtime,
          selection: runtime.selection(),
          fullPredicate: runtime.fullPredicate(currentNode.navId),
        };
        const hasOutput = (tokenName: string): boolean => {
          const token = runtime.tokens.byName(tokenName);
          if (!token) return false;
          const value = token.compute(ctx);
          return value.short !== '' || value.long !== '';
        };

        const newEntries: TokenFormEntry[] = [];
        for (const entry of presetForRole.recipe) {
          const token = runtime.tokens.byName(entry.token);
          if (token && isTokenApplicable(token, role) && hasOutput(entry.token)) {
            newEntries.push({
              token: entry.token,
              included: true,
              brevity: entry.brevity,
            });
          }
        }
        for (const token of applicableTokens) {
          if (!recipeMap.has(token.name) && hasOutput(token.name)) {
            newEntries.push({ token: token.name, included: false, brevity: 'short' });
          }
        }
        setEntries(newEntries);
      };

      const toggleToken = (idx: number) => {
        const newEntries = entries().map((e, i) =>
          i === idx ? { ...e, included: !e.included } : e,
        );
        setEntries(newEntries);
        setPreset(detectPreset(presets, selectedRole(), newEntries));
      };

      const setBrevity = (idx: number, brevity: Brevity) => {
        const newEntries = entries().map((e, i) =>
          i === idx ? { ...e, brevity } : e,
        );
        setEntries(newEntries);
        setPreset(detectPreset(presets, selectedRole(), newEntries));
      };

      const moveToken = (idx: number, direction: -1 | 1) => {
        const prev = entries();
        const next = [...prev];
        const targetIdx = idx + direction;
        if (targetIdx < 0 || targetIdx >= next.length) return;
        [next[idx], next[targetIdx]] = [next[targetIdx]!, next[idx]!];
        setEntries(next);
        setPreset(detectPreset(presets, selectedRole(), next));
      };

      const applyChanges = () => {
        entriesCache.set(selectedRole(), entries());
        for (const [role, roleEntries] of entriesCache) {
          const recipe: RecipeEntry[] = roleEntries
            .filter((e) => e.included)
            .map((e) => ({ token: e.token, brevity: e.brevity }));
          runtime.customization.setFor(role, { role, recipe, duration: 'persistent' });
        }
      };

      const resetToDefault = () => {
        const role = selectedRole();
        if (config.defaultPreset) {
          const found = presets.find((p) => p.name === config.defaultPreset);
          if (found) {
            const presetForRole = found.customizations.find((c) => c.role === role);
            if (presetForRole) {
              runtime.customization.setFor(role, presetForRole);
              const newEntries = buildFormEntries(runtime, role, nodeForRole());
              setEntries(newEntries);
              setPreset(detectPreset(presets, role, newEntries));
              return;
            }
          }
        }
        runtime.customization.resetFor(role);
        const newEntries = buildFormEntries(runtime, role, nodeForRole());
        setEntries(newEntries);
        setPreset(detectPreset(presets, role, newEntries));
      };

      return {
        title: 'Description Settings',
        content: (
          <div class="olli-description-settings-dialog">
            <label>
              Role:{' '}
              <select
                value={selectedRole()}
                onChange={(e) => handleRoleChange(e.currentTarget.value)}
              >
                <For each={filteredRoles}>
                  {(role) => <option value={role.value}>{role.label}</option>}
                </For>
              </select>
            </label>

            <div role="status" aria-live="polite" class="olli-description-preview">
              Preview: {preview() ? parseInlineCode(preview()!) : '(empty)'}
            </div>

            <Show when={hasPresets}>
              <fieldset>
                <legend>Detail level</legend>
                <For each={presetChoices()}>
                  {(choice) => (
                    <label>
                      <input
                        type="radio"
                        name="preset"
                        value={choice}
                        checked={preset() === choice}
                        onChange={() => handlePresetChange(choice)}
                      />
                      {' '}
                      {choice.charAt(0).toUpperCase() + choice.slice(1)}
                    </label>
                  )}
                </For>
              </fieldset>
            </Show>

            <fieldset class="olli-token-editor">
              <legend>Customize tokens</legend>
              <For each={entries()}>
                {(entry, i) => (
                  <div class="olli-token-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={entry.included}
                        onChange={() => toggleToken(i())}
                      />
                      {' '}
                      {tokenLabel(entry.token, config.tokenLabels)}
                    </label>
                    {(() => {
                      const desc = tokenDescription(entry.token, config.tokenDescriptions);
                      return desc ? <span class="olli-token-description">{'. '}{desc}{'. '}</span> : null;
                    })()}
                    <Show when={entry.included}>
                      <select
                        value={entry.brevity}
                        onChange={(e) =>
                          setBrevity(i(), e.currentTarget.value as Brevity)
                        }
                      >
                        <option value="short">Concise</option>
                        <option value="long">Full</option>
                      </select>
                      <button
                        onClick={() => moveToken(i(), -1)}
                        disabled={i() === 0}
                        aria-label={`Move ${tokenLabel(entry.token, config.tokenLabels)} up`}
                      >
                        Move up
                      </button>
                      <button
                        onClick={() => moveToken(i(), 1)}
                        disabled={i() === entries().length - 1}
                        aria-label={`Move ${tokenLabel(entry.token, config.tokenLabels)} down`}
                      >
                        Move down
                      </button>
                    </Show>
                  </div>
                )}
              </For>
            </fieldset>

            <button onClick={resetToDefault}>Reset</button>
          </div>
        ),
        onSubmit: applyChanges,
      };
    },
  };
}
