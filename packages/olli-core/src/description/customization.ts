import { createSignal, type Accessor, type Setter } from 'solid-js';
import { VIRTUAL_ROLE, type TokenName } from './tokens.js';

export type Brevity = 'short' | 'long';
export type Duration = 'persistent' | 'ephemeral';

export interface RecipeEntry {
  token: TokenName;
  brevity: Brevity;
}

export interface Customization {
  role: string;
  recipe: readonly RecipeEntry[];
  duration: Duration;
}

export type RecipeFilter = (role: string, recipe: readonly RecipeEntry[]) => readonly RecipeEntry[];

export interface CustomizationStore {
  activeFor(role: string): Accessor<Customization>;
  setFor(role: string, customization: Customization): void;
  resetFor(role: string): void;
  registerPreset(name: string, customizations: readonly Customization[]): void;
  applyPreset(name: string): void;
  activePresetName(): string | null;
  listPresets(): ReadonlyArray<{ name: string; customizations: readonly Customization[] }>;
  setRecipeFilter(fn: RecipeFilter | null): void;
  recipeFilter(): RecipeFilter | null;
}

export const DEFAULT_RECIPE: readonly RecipeEntry[] = [
  { token: 'name', brevity: 'long' },
  { token: 'index', brevity: 'long' },
  { token: 'parent', brevity: 'long' },
  { token: 'children', brevity: 'long' },
];

export const DEFAULT_VIRTUAL_RECIPE: readonly RecipeEntry[] = [
  { token: 'parentContext', brevity: 'long' },
];

export function defaultCustomizationFor(role: string): Customization {
  return {
    role,
    recipe: role === VIRTUAL_ROLE ? DEFAULT_VIRTUAL_RECIPE : DEFAULT_RECIPE,
    duration: 'persistent',
  };
}

export function createCustomizationStore(): CustomizationStore {
  const perRole = new Map<string, { get: Accessor<Customization>; set: Setter<Customization> }>();
  const presets = new Map<string, readonly Customization[]>();
  const [activePreset, setActivePreset] = createSignal<string | null>(null);
  let filterFn: RecipeFilter | null = null;

  function applyFilter(role: string, c: Customization): Customization {
    if (!filterFn) return c;
    return { ...c, recipe: filterFn(role, c.recipe) };
  }

  function ensure(role: string) {
    const existing = perRole.get(role);
    if (existing) return existing;
    const [get, set] = createSignal<Customization>(applyFilter(role, defaultCustomizationFor(role)));
    const entry = { get, set };
    perRole.set(role, entry);
    return entry;
  }

  return {
    activeFor(role) {
      return ensure(role).get;
    },
    setFor(role, customization) {
      ensure(role).set(() => customization);
    },
    resetFor(role) {
      ensure(role).set(() => applyFilter(role, defaultCustomizationFor(role)));
    },
    registerPreset(name, customizations) {
      presets.set(name, customizations);
    },
    applyPreset(name) {
      const preset = presets.get(name);
      if (!preset) throw new Error(`unknown preset: ${name}`);
      for (const customization of preset) {
        ensure(customization.role).set(() => applyFilter(customization.role, customization));
      }
      setActivePreset(name);
    },
    activePresetName() {
      return activePreset();
    },
    listPresets() {
      return [...presets.entries()].map(([name, customizations]) => ({ name, customizations }));
    },
    setRecipeFilter(fn) {
      filterFn = fn;
    },
    recipeFilter() {
      return filterFn;
    },
  };
}
