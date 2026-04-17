import { describe, it, expect, afterEach } from 'vitest';
import { mountSolidApp, createVisRuntime } from './index.jsx';

let dispose: (() => void) | undefined;
let container: HTMLElement;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  container?.remove();
});

describe('solid-app example', () => {
  it('mounts and renders a tree view using Solid directly', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    dispose = mountSolidApp(container);

    expect(container.querySelector('[role="tree"]')).not.toBeNull();
  });

  it('creates a runtime with vis domain tokens', () => {
    const runtime = createVisRuntime();
    expect(runtime.tokens.all().length).toBeGreaterThan(0);
  });

  it('runtime has vis keybindings registered', () => {
    const runtime = createVisRuntime();
    expect(runtime.keybindings.list().length).toBeGreaterThan(0);
  });

  it('renders tree items for the chart structure', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    dispose = mountSolidApp(container);

    const treeItems = container.querySelectorAll('[role="treeitem"]');
    expect(treeItems.length).toBeGreaterThan(0);
  });
});
