import { createSignal, type Accessor, type Setter } from 'solid-js';
import { VIRTUAL_ROLE, type TokenName } from './tokens.js';

export type Brevity = 'short' | 'long';

export interface RecipeEntry {
  token: TokenName;
  brevity: Brevity;
}

export interface Customization {
  role: string;
  recipe: readonly RecipeEntry[];
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
  hydrateFromStorage(): void;
  clearStorage(): void;
}

export const DEFAULT_RECIPE: readonly RecipeEntry[] = [
  { token: 'name', brevity: 'long' },
  { token: 'index', brevity: 'short' },
  { token: 'parent', brevity: 'long' },
  { token: 'children', brevity: 'short' },
];

export const DEFAULT_VIRTUAL_RECIPE: readonly RecipeEntry[] = [
  { token: 'parentContext', brevity: 'long' },
];

export function defaultCustomizationFor(role: string): Customization {
  return {
    role,
    recipe: role === VIRTUAL_ROLE ? DEFAULT_VIRTUAL_RECIPE : DEFAULT_RECIPE,
  };
}

// --- localStorage persistence ---

interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface CustomizationStoreConfig {
  storage?: StorageBackend | null;
}

const STORAGE_KEY = 'olli:customization:v1';
const STORAGE_VERSION = 1;

interface StoredData {
  v: number;
  roles: Record<string, { role: string; recipe: RecipeEntry[] }>;
}

function resolveStorage(config?: CustomizationStoreConfig): StorageBackend | null {
  if (config && 'storage' in config) return config.storage ?? null;
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    // localStorage access can throw in some environments
  }
  return null;
}

function isValidRecipeEntry(e: unknown): e is RecipeEntry {
  if (typeof e !== 'object' || e === null) return false;
  const obj = e as Record<string, unknown>;
  return typeof obj.token === 'string' && (obj.brevity === 'short' || obj.brevity === 'long');
}

function isValidStoredData(data: unknown): data is StoredData {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (obj.v !== STORAGE_VERSION) return false;
  if (typeof obj.roles !== 'object' || obj.roles === null) return false;
  for (const entry of Object.values(obj.roles as Record<string, unknown>)) {
    if (typeof entry !== 'object' || entry === null) return false;
    const e = entry as Record<string, unknown>;
    if (typeof e.role !== 'string') return false;
    if (!Array.isArray(e.recipe) || !e.recipe.every(isValidRecipeEntry)) return false;
  }
  return true;
}

function tryReadStorage(storage: StorageBackend): StoredData | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (isValidStoredData(data)) return data;
    storage.removeItem(STORAGE_KEY);
  } catch {
    // corrupt or inaccessible
  }
  return null;
}

function tryWriteStorage(storage: StorageBackend, data: StoredData): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // quota exceeded or inaccessible
  }
}

function persistRole(storage: StorageBackend, role: string, customization: Customization): void {
  const data = tryReadStorage(storage) ?? { v: STORAGE_VERSION, roles: {} };
  data.roles[role] = { role: customization.role, recipe: [...customization.recipe] };
  tryWriteStorage(storage, data);
}

function removeRoleFromStorage(storage: StorageBackend, role: string): void {
  const data = tryReadStorage(storage);
  if (!data) return;
  delete data.roles[role];
  if (Object.keys(data.roles).length === 0) {
    try { storage.removeItem(STORAGE_KEY); } catch { /* swallow */ }
  } else {
    tryWriteStorage(storage, data);
  }
}

// --- store factory ---

export function createCustomizationStore(config?: CustomizationStoreConfig): CustomizationStore {
  const resolvedStorage = resolveStorage(config);
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
      if (resolvedStorage) persistRole(resolvedStorage, role, customization);
    },
    resetFor(role) {
      ensure(role).set(() => applyFilter(role, defaultCustomizationFor(role)));
      if (resolvedStorage) removeRoleFromStorage(resolvedStorage, role);
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
    hydrateFromStorage() {
      if (!resolvedStorage) return;
      const data = tryReadStorage(resolvedStorage);
      if (!data) return;
      for (const [role, entry] of Object.entries(data.roles)) {
        ensure(role).set(() => ({ role: entry.role, recipe: entry.recipe }));
      }
    },
    clearStorage() {
      if (!resolvedStorage) return;
      try { resolvedStorage.removeItem(STORAGE_KEY); } catch { /* swallow */ }
    },
  };
}
