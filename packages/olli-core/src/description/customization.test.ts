import { createRoot } from 'solid-js';
import { describe, it, expect } from 'vitest';
import {
  createCustomizationStore,
  defaultCustomizationFor,
  DEFAULT_RECIPE,
  DEFAULT_VIRTUAL_RECIPE,
  type Customization,
  type CustomizationStoreConfig,
} from './customization.js';
import { VIRTUAL_ROLE } from './tokens.js';

function createMockStorage(): CustomizationStoreConfig['storage'] & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem(key: string) { return data.get(key) ?? null; },
    setItem(key: string, value: string) { data.set(key, value); },
    removeItem(key: string) { data.delete(key); },
  };
}

describe('defaultCustomizationFor', () => {
  it('returns default recipe for normal roles', () => {
    const c = defaultCustomizationFor('xAxis');
    expect(c.role).toBe('xAxis');
    expect(c.recipe).toEqual(DEFAULT_RECIPE);
  });

  it('returns virtual recipe for VIRTUAL_ROLE', () => {
    const c = defaultCustomizationFor(VIRTUAL_ROLE);
    expect(c.recipe).toEqual(DEFAULT_VIRTUAL_RECIPE);
  });
});

describe('createCustomizationStore', () => {
  it('activeFor returns default customization on first access', () => {
    createRoot((dispose) => {
      const store = createCustomizationStore();
      const c = store.activeFor('xAxis')();
      expect(c.role).toBe('xAxis');
      expect(c.recipe).toEqual(DEFAULT_RECIPE);
      dispose();
    });
  });

  it('setFor overrides customization', () => {
    createRoot((dispose) => {
      const store = createCustomizationStore();
      const custom: Customization = {
        role: 'xAxis',
        recipe: [{ token: 'name', brevity: 'short' }],
      };
      store.setFor('xAxis', custom);
      expect(store.activeFor('xAxis')()).toEqual(custom);
      dispose();
    });
  });

  it('resetFor reverts to default', () => {
    createRoot((dispose) => {
      const store = createCustomizationStore();
      store.setFor('xAxis', {
        role: 'xAxis',
        recipe: [{ token: 'name', brevity: 'short' }],
      });
      store.resetFor('xAxis');
      expect(store.activeFor('xAxis')().recipe).toEqual(DEFAULT_RECIPE);
      dispose();
    });
  });

  it('registerPreset + applyPreset updates roles', () => {
    createRoot((dispose) => {
      const store = createCustomizationStore();
      const preset: Customization[] = [
        { role: 'xAxis', recipe: [{ token: 'name', brevity: 'short' }] },
        { role: 'yAxis', recipe: [{ token: 'index', brevity: 'long' }] },
      ];
      store.registerPreset('minimal', preset);
      store.applyPreset('minimal');
      expect(store.activeFor('xAxis')().recipe).toEqual([{ token: 'name', brevity: 'short' }]);
      expect(store.activeFor('yAxis')().recipe).toEqual([{ token: 'index', brevity: 'long' }]);
      dispose();
    });
  });

  it('applyPreset throws for unknown preset', () => {
    createRoot((dispose) => {
      const store = createCustomizationStore();
      expect(() => store.applyPreset('nonexistent')).toThrow('unknown preset');
      dispose();
    });
  });

  it('activePresetName tracks applied preset', () => {
    createRoot((dispose) => {
      const store = createCustomizationStore();
      expect(store.activePresetName()).toBeNull();
      store.registerPreset('detailed', []);
      store.applyPreset('detailed');
      expect(store.activePresetName()).toBe('detailed');
      dispose();
    });
  });

  it('listPresets returns all registered presets', () => {
    createRoot((dispose) => {
      const store = createCustomizationStore();
      store.registerPreset('a', []);
      store.registerPreset('b', []);
      const list = store.listPresets();
      expect(list.map((p) => p.name)).toEqual(['a', 'b']);
      dispose();
    });
  });

  it('recipeFilter transforms new roles', () => {
    createRoot((dispose) => {
      const store = createCustomizationStore();
      store.setRecipeFilter((_role, recipe) => recipe.filter((e) => e.token !== 'parent'));
      const c = store.activeFor('freshRole')();
      expect(c.recipe.find((e) => e.token === 'parent')).toBeUndefined();
      expect(c.recipe.find((e) => e.token === 'name')).toBeDefined();
      dispose();
    });
  });

  it('recipeFilter applied during applyPreset', () => {
    createRoot((dispose) => {
      const store = createCustomizationStore();
      store.setRecipeFilter((_role, recipe) => recipe.slice(0, 1));
      store.registerPreset('test', [
        {
          role: 'xAxis',
          recipe: [
            { token: 'name', brevity: 'long' },
            { token: 'index', brevity: 'long' },
            { token: 'parent', brevity: 'long' },
          ],
        },
      ]);
      store.applyPreset('test');
      expect(store.activeFor('xAxis')().recipe).toHaveLength(1);
      dispose();
    });
  });

  it('recipeFilter applied during resetFor', () => {
    createRoot((dispose) => {
      const store = createCustomizationStore();
      store.setRecipeFilter((_role, recipe) => recipe.filter((e) => e.token === 'name'));
      store.activeFor('xAxis');
      store.resetFor('xAxis');
      const c = store.activeFor('xAxis')();
      expect(c.recipe).toEqual([{ token: 'name', brevity: 'long' }]);
      dispose();
    });
  });

  it('recipeFilter getter returns the set filter', () => {
    createRoot((dispose) => {
      const store = createCustomizationStore();
      expect(store.recipeFilter()).toBeNull();
      const fn = () => [];
      store.setRecipeFilter(fn);
      expect(store.recipeFilter()).toBe(fn);
      store.setRecipeFilter(null);
      expect(store.recipeFilter()).toBeNull();
      dispose();
    });
  });
});

describe('persistence', () => {
  it('setFor writes to storage', () => {
    createRoot((dispose) => {
      const storage = createMockStorage();
      const store = createCustomizationStore({ storage });
      store.setFor('xAxis', { role: 'xAxis', recipe: [{ token: 'name', brevity: 'short' }] });
      const raw = JSON.parse(storage.data.get('olli:customization:v1')!);
      expect(raw.v).toBe(1);
      expect(raw.roles.xAxis.recipe).toEqual([{ token: 'name', brevity: 'short' }]);
      dispose();
    });
  });

  it('resetFor removes role from storage', () => {
    createRoot((dispose) => {
      const storage = createMockStorage();
      const store = createCustomizationStore({ storage });
      store.setFor('xAxis', { role: 'xAxis', recipe: [{ token: 'name', brevity: 'short' }] });
      store.setFor('yAxis', { role: 'yAxis', recipe: [{ token: 'index', brevity: 'long' }] });
      store.resetFor('xAxis');
      const raw = JSON.parse(storage.data.get('olli:customization:v1')!);
      expect(raw.roles.xAxis).toBeUndefined();
      expect(raw.roles.yAxis).toBeDefined();
      dispose();
    });
  });

  it('resetFor removes storage key when last role is cleared', () => {
    createRoot((dispose) => {
      const storage = createMockStorage();
      const store = createCustomizationStore({ storage });
      store.setFor('xAxis', { role: 'xAxis', recipe: [{ token: 'name', brevity: 'short' }] });
      store.resetFor('xAxis');
      expect(storage.data.has('olli:customization:v1')).toBe(false);
      dispose();
    });
  });

  it('hydrateFromStorage applies stored customizations', () => {
    createRoot((dispose) => {
      const storage = createMockStorage();
      storage.setItem('olli:customization:v1', JSON.stringify({
        v: 1,
        roles: { xAxis: { role: 'xAxis', recipe: [{ token: 'name', brevity: 'short' }] } },
      }));
      const store = createCustomizationStore({ storage });
      store.hydrateFromStorage();
      expect(store.activeFor('xAxis')().recipe).toEqual([{ token: 'name', brevity: 'short' }]);
      dispose();
    });
  });

  it('hydrateFromStorage discards data with wrong version', () => {
    createRoot((dispose) => {
      const storage = createMockStorage();
      storage.setItem('olli:customization:v1', JSON.stringify({
        v: 99,
        roles: { xAxis: { role: 'xAxis', recipe: [{ token: 'name', brevity: 'short' }] } },
      }));
      const store = createCustomizationStore({ storage });
      store.hydrateFromStorage();
      expect(store.activeFor('xAxis')().recipe).toEqual(DEFAULT_RECIPE);
      expect(storage.data.has('olli:customization:v1')).toBe(false);
      dispose();
    });
  });

  it('hydrateFromStorage discards malformed data', () => {
    createRoot((dispose) => {
      const storage = createMockStorage();
      storage.setItem('olli:customization:v1', 'not json');
      const store = createCustomizationStore({ storage });
      store.hydrateFromStorage();
      expect(store.activeFor('xAxis')().recipe).toEqual(DEFAULT_RECIPE);
      dispose();
    });
  });

  it('hydrateFromStorage is a no-op when storage is empty', () => {
    createRoot((dispose) => {
      const storage = createMockStorage();
      const store = createCustomizationStore({ storage });
      store.hydrateFromStorage();
      expect(store.activeFor('xAxis')().recipe).toEqual(DEFAULT_RECIPE);
      dispose();
    });
  });

  it('clearStorage removes the storage key', () => {
    createRoot((dispose) => {
      const storage = createMockStorage();
      const store = createCustomizationStore({ storage });
      store.setFor('xAxis', { role: 'xAxis', recipe: [{ token: 'name', brevity: 'short' }] });
      store.clearStorage();
      expect(storage.data.has('olli:customization:v1')).toBe(false);
      dispose();
    });
  });

  it('round-trip: setFor then hydrateFromStorage on new store', () => {
    createRoot((dispose) => {
      const storage = createMockStorage();
      const store1 = createCustomizationStore({ storage });
      const custom: Customization = {
        role: 'xAxis',
        recipe: [
          { token: 'name', brevity: 'short' },
          { token: 'index', brevity: 'long' },
        ],
      };
      store1.setFor('xAxis', custom);

      const store2 = createCustomizationStore({ storage });
      store2.hydrateFromStorage();
      expect(store2.activeFor('xAxis')()).toEqual(custom);
      dispose();
    });
  });

  it('degrades silently when storage is null', () => {
    createRoot((dispose) => {
      const store = createCustomizationStore({ storage: null });
      store.setFor('xAxis', { role: 'xAxis', recipe: [{ token: 'name', brevity: 'short' }] });
      store.hydrateFromStorage();
      store.clearStorage();
      dispose();
    });
  });

  it('degrades silently when setItem throws', () => {
    createRoot((dispose) => {
      const storage = createMockStorage();
      storage.setItem = () => { throw new Error('QuotaExceededError'); };
      const store = createCustomizationStore({ storage });
      store.setFor('xAxis', { role: 'xAxis', recipe: [{ token: 'name', brevity: 'short' }] });
      expect(store.activeFor('xAxis')().recipe).toEqual([{ token: 'name', brevity: 'short' }]);
      dispose();
    });
  });
});
