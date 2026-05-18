import { createRoot } from 'solid-js';
import { describe, it, expect } from 'vitest';
import {
  createCustomizationStore,
  defaultCustomizationFor,
  DEFAULT_RECIPE,
  DEFAULT_VIRTUAL_RECIPE,
  type Customization,
} from './customization.js';
import { VIRTUAL_ROLE } from './tokens.js';

describe('defaultCustomizationFor', () => {
  it('returns default recipe for normal roles', () => {
    const c = defaultCustomizationFor('xAxis');
    expect(c.role).toBe('xAxis');
    expect(c.recipe).toEqual(DEFAULT_RECIPE);
    expect(c.duration).toBe('persistent');
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
        duration: 'ephemeral',
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
        duration: 'ephemeral',
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
        { role: 'xAxis', recipe: [{ token: 'name', brevity: 'short' }], duration: 'persistent' },
        { role: 'yAxis', recipe: [{ token: 'index', brevity: 'long' }], duration: 'persistent' },
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
          duration: 'persistent',
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
