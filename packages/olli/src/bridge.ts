import { createEffect, createRoot } from 'solid-js';

export function bridgeSignal<T>(read: () => T, cb: (value: T) => void): () => void {
  let dispose!: () => void;
  createRoot((d) => {
    dispose = d;
    createEffect(() => cb(read()));
  });
  return dispose;
}
