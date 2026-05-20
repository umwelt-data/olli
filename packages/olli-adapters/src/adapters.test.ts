import { describe, it, expect } from 'vitest';
import { VegaAdapter, VegaAdapterSync, VegaLiteAdapter, ObservablePlotAdapter } from './index.js';

describe('adapter exports', () => {
  it('VegaAdapter is a function', () => {
    expect(typeof VegaAdapter).toBe('function');
  });

  it('VegaAdapterSync is a function', () => {
    expect(typeof VegaAdapterSync).toBe('function');
  });

  it('VegaLiteAdapter is a function', () => {
    expect(typeof VegaLiteAdapter).toBe('function');
  });

  it('ObservablePlotAdapter is a function', () => {
    expect(typeof ObservablePlotAdapter).toBe('function');
  });
});
