import { describe, it, expect, vi } from 'vitest';
import { createKeybindingRegistry } from './keybindings.js';
import type { NavigationRuntime } from './runtime.js';

const fakeRuntime = {} as NavigationRuntime<unknown>;

function keyEvent(key: string, modifiers: Partial<Pick<KeyboardEvent, 'metaKey' | 'ctrlKey' | 'altKey'>> = {}): KeyboardEvent {
  return { key, metaKey: false, ctrlKey: false, altKey: false, ...modifiers } as KeyboardEvent;
}

describe('createKeybindingRegistry', () => {
  it('registers and lists bindings', () => {
    const reg = createKeybindingRegistry();
    const handler = vi.fn(() => true);
    reg.register({ key: 'x', handler });
    expect(reg.list()).toHaveLength(1);
    expect(reg.list()[0]!.key).toBe('x');
  });

  it('dispatch calls matching handler and returns true', () => {
    const reg = createKeybindingRegistry();
    const handler = vi.fn(() => true);
    reg.register({ key: 'x', handler });
    const result = reg.dispatch(fakeRuntime, keyEvent('x'));
    expect(result).toBe(true);
    expect(handler).toHaveBeenCalledWith(fakeRuntime, expect.any(Object));
  });

  it('dispatch returns false when no handler matches', () => {
    const reg = createKeybindingRegistry();
    reg.register({ key: 'x', handler: vi.fn(() => true) });
    expect(reg.dispatch(fakeRuntime, keyEvent('y'))).toBe(false);
  });

  it('dispatch skips when metaKey is pressed', () => {
    const reg = createKeybindingRegistry();
    const handler = vi.fn(() => true);
    reg.register({ key: 'x', handler });
    expect(reg.dispatch(fakeRuntime, keyEvent('x', { metaKey: true }))).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });

  it('dispatch skips when ctrlKey is pressed', () => {
    const reg = createKeybindingRegistry();
    const handler = vi.fn(() => true);
    reg.register({ key: 'x', handler });
    expect(reg.dispatch(fakeRuntime, keyEvent('x', { ctrlKey: true }))).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });

  it('dispatch skips when altKey is pressed', () => {
    const reg = createKeybindingRegistry();
    const handler = vi.fn(() => true);
    reg.register({ key: 'x', handler });
    expect(reg.dispatch(fakeRuntime, keyEvent('x', { altKey: true }))).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });

  it('dispatch stops at first handler returning true', () => {
    const reg = createKeybindingRegistry();
    const first = vi.fn(() => true);
    const second = vi.fn(() => true);
    reg.register({ key: 'x', handler: first });
    reg.register({ key: 'x', handler: second });
    reg.dispatch(fakeRuntime, keyEvent('x'));
    expect(first).toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
  });

  it('dispatch continues past handlers returning false', () => {
    const reg = createKeybindingRegistry();
    const first = vi.fn(() => false);
    const second = vi.fn(() => true);
    reg.register({ key: 'x', handler: first });
    reg.register({ key: 'x', handler: second });
    const result = reg.dispatch(fakeRuntime, keyEvent('x'));
    expect(result).toBe(true);
    expect(first).toHaveBeenCalled();
    expect(second).toHaveBeenCalled();
  });
});
