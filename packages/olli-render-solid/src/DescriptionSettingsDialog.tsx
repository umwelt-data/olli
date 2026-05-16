import { For, Show, createSignal, createMemo } from 'solid-js';
import type {
  DialogContribution,
  DialogRenderResult,
  NavigationRuntime,
  NavNode,
  Customization,
  RecipeEntry,
  Brevity,
} from 'olli-core';
import { isTokenApplicable } from 'olli-core';

interface TokenFormEntry {
  token: string;
  included: boolean;
  brevity: Brevity;
}

export interface DescriptionSettingsConfig {
  roles: ReadonlyArray<{ value: string; label: string }>;
  tokenLabels?: Record<string, string>;
  roleForNode: (runtime: NavigationRuntime<any>, navNode: NavNode) => string;
}

function tokenLabel(name: string, labels?: Record<string, string>): string {
  return labels?.[name] ?? name;
}

type PresetChoice = string | 'custom';

function detectPreset(
  presets: ReadonlyArray<{ name: string; customizations: readonly Customization[] }>,
  role: string,
  entries: TokenFormEntry[],
): PresetChoice {
  for (const preset of presets) {
    const presetForRole = preset.customizations.find((c) => c.role === role);
    if (!presetForRole) continue;
    const included = entries.filter((e) => e.included);
    if (included.length !== presetForRole.recipe.length) continue;
    const matches = included.every(
      (e, i) =>
        e.token === presetForRole.recipe[i]?.token &&
        e.brevity === presetForRole.recipe[i]?.brevity,
    );
    if (matches) return preset.name;
  }
  return 'custom';
}

function buildFormEntries<P>(
  runtime: NavigationRuntime<P>,
  role: string,
): TokenFormEntry[] {
  const active = runtime.customization.activeFor(role)();
  const applicableTokens = runtime.tokens.applicableTo(role);
  const recipeMap = new Map(active.recipe.map((e) => [e.token, e.brevity]));

  const entries: TokenFormEntry[] = [];
  for (const entry of active.recipe) {
    const token = runtime.tokens.byName(entry.token);
    if (token && isTokenApplicable(token, role)) {
      entries.push({ token: entry.token, included: true, brevity: entry.brevity });
    }
  }
  for (const token of applicableTokens) {
    if (!recipeMap.has(token.name)) {
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

  const parts: string[] = [];
  for (const entry of entries) {
    if (!entry.included) continue;
    const token = runtime.tokens.byName(entry.token);
    if (!token || !isTokenApplicable(token, role)) continue;
    const value = token.compute(ctx);
    const s = entry.brevity === 'long' ? value.long : value.short;
    if (s) parts.push(s);
  }
  return parts.join('. ');
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
      const presets = runtime.customization.listPresets();

      const initialEntries = buildFormEntries(runtime, initialRole);
      const [selectedRole, setSelectedRole] = createSignal(initialRole);
      const [entries, setEntries] = createSignal<TokenFormEntry[]>(initialEntries);
      const [preset, setPreset] = createSignal<PresetChoice>(
        detectPreset(presets, initialRole, initialEntries),
      );
      const [showTokenEditor, setShowTokenEditor] = createSignal(false);

      const preview = createMemo(() =>
        computePreview(runtime, navNode, selectedRole(), entries()),
      );

      const handleRoleChange = (role: string) => {
        setSelectedRole(role);
        const newEntries = buildFormEntries(runtime, role);
        setEntries(newEntries);
        setPreset(detectPreset(presets, role, newEntries));
        setShowTokenEditor(false);
      };

      const presetChoices = createMemo(() => [
        ...presets.map((p) => p.name),
        'custom',
      ]);

      const handlePresetChange = (choice: PresetChoice) => {
        setPreset(choice);
        if (choice === 'custom') {
          setShowTokenEditor(true);
          return;
        }
        const role = selectedRole();
        const found = presets.find((p) => p.name === choice);
        if (!found) return;
        const presetForRole = found.customizations.find((c) => c.role === role);
        if (!presetForRole) return;

        const recipeMap = new Map(
          presetForRole.recipe.map((e) => [e.token, e.brevity]),
        );
        const applicableTokens = runtime.tokens.applicableTo(role);
        const newEntries: TokenFormEntry[] = [];
        for (const entry of presetForRole.recipe) {
          const token = runtime.tokens.byName(entry.token);
          if (token && isTokenApplicable(token, role)) {
            newEntries.push({
              token: entry.token,
              included: true,
              brevity: entry.brevity,
            });
          }
        }
        for (const token of applicableTokens) {
          if (!recipeMap.has(token.name)) {
            newEntries.push({ token: token.name, included: false, brevity: 'short' });
          }
        }
        setEntries(newEntries);
        setShowTokenEditor(false);
      };

      const toggleToken = (idx: number) => {
        setEntries((prev) =>
          prev.map((e, i) => (i === idx ? { ...e, included: !e.included } : e)),
        );
        setPreset('custom');
      };

      const setBrevity = (idx: number, brevity: Brevity) => {
        setEntries((prev) =>
          prev.map((e, i) => (i === idx ? { ...e, brevity } : e)),
        );
        setPreset('custom');
      };

      const moveToken = (idx: number, direction: -1 | 1) => {
        setEntries((prev) => {
          const next = [...prev];
          const targetIdx = idx + direction;
          if (targetIdx < 0 || targetIdx >= next.length) return prev;
          [next[idx], next[targetIdx]] = [next[targetIdx]!, next[idx]!];
          return next;
        });
        setPreset('custom');
      };

      const applyChanges = () => {
        const role = selectedRole();
        if (preset() !== 'custom') {
          runtime.customization.applyPreset(preset());
        } else {
          const recipe: RecipeEntry[] = entries()
            .filter((e) => e.included)
            .map((e) => ({ token: e.token, brevity: e.brevity }));
          const customization: Customization = {
            role,
            recipe,
            duration: 'persistent',
          };
          runtime.customization.setFor(role, customization);
        }
      };

      const resetToDefault = () => {
        const role = selectedRole();
        runtime.customization.resetFor(role);
        setEntries(buildFormEntries(runtime, role));
        setPreset('custom');
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
                <For each={config.roles}>
                  {(role) => <option value={role.value}>{role.label}</option>}
                </For>
              </select>
            </label>

            <div role="status" aria-live="polite" class="olli-description-preview">
              Preview: {preview() || '(empty)'}
            </div>

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

            <Show when={preset() === 'custom' || showTokenEditor()}>
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
                      <Show when={entry.included}>
                        <select
                          value={entry.brevity}
                          onChange={(e) =>
                            setBrevity(i(), e.currentTarget.value as Brevity)
                          }
                        >
                          <option value="short">Short</option>
                          <option value="long">Long</option>
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
            </Show>

            <button onClick={resetToDefault}>Reset</button>
          </div>
        ),
        onSubmit: applyChanges,
      };
    },
  };
}
