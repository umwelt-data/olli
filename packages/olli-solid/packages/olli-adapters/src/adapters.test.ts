import { describe, it, expect } from 'vitest';
import { VegaAdapter, VegaLiteAdapter, ObservablePlotAdapter } from './index.js';

describe('adapter exports', () => {
  it('VegaAdapter is a function', () => {
    expect(typeof VegaAdapter).toBe('function');
  });

  it('VegaLiteAdapter is a function', () => {
    expect(typeof VegaLiteAdapter).toBe('function');
  });

  it('ObservablePlotAdapter is a function', () => {
    expect(typeof ObservablePlotAdapter).toBe('function');
  });
});
