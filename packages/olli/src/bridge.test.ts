import { describe, it, expect } from 'vitest';
import { createSignal } from 'solid-js';
import { bridgeSignal } from './bridge.js';

describe('bridgeSignal', () => {
  it('fires callback with initial value', () => {
    const [value] = createSignal(42);
    const received: number[] = [];
    const unsub = bridgeSignal(value, (v) => received.push(v));
    expect(received).toContain(42);
    unsub();
  });

  it('fires callback on signal change', () => {
    const [value, setValue] = createSignal(1);
    const received: number[] = [];
    const unsub = bridgeSignal(value, (v) => received.push(v));

    setValue(2);
    expect(received).toContain(1);
    expect(received).toContain(2);

    unsub();
  });

  it('unsubscribe stops further callbacks', () => {
    const [value, setValue] = createSignal(1);
    const received: number[] = [];
    const unsub = bridgeSignal(value, (v) => received.push(v));

    unsub();
    const countAfterUnsub = received.length;
    setValue(99);
    expect(received.length).toBe(countAfterUnsub);
  });
});
