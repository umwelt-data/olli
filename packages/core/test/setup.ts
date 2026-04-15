import { beforeEach } from 'vitest';

process.env.TZ = 'UTC';

let seed = 0xdeadbeef;
Math.random = () => {
  seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
  return seed / 0x80000000;
};

// jsdom 24's innerText setter is a no-op (it relies on layout). The render
// code uses `.innerText =` heavily, so route it to textContent in tests.
Object.defineProperty(window.HTMLElement.prototype, 'innerText', {
  configurable: true,
  get() {
    return this.textContent ?? '';
  },
  set(value: string) {
    this.textContent = value;
  },
});

// vega-scenegraph loads a canvas on import and jsdom logs a "not implemented"
// error; stub getContext so that noise doesn't clutter test output.
window.HTMLCanvasElement.prototype.getContext = (() => null) as any;

beforeEach(() => {
  seed = 0xdeadbeef;
  window.localStorage.clear();
});
