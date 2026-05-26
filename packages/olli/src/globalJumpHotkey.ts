import type { OlliHandle } from './handle.js';

interface Entry {
  container: HTMLElement;
  handle: OlliHandle;
}

const entries: Entry[] = [];
let lastFocusedEntry: Entry | null = null;
let installed = false;

/**
 * Register an Olli instance with the page-wide `o` hotkey: pressing `o` while
 * not typing into an input jumps focus to the last Olli tree that had focus,
 * or the first registered tree if none has. The handler is idempotent — only
 * one window listener is installed regardless of how many instances register.
 * Returns a teardown that removes the container from the registry.
 */
export function registerForJumpHotkey(
  container: HTMLElement,
  handle: OlliHandle,
): () => void {
  const entry: Entry = { container, handle };
  entries.push(entry);

  const onFocusIn = () => {
    lastFocusedEntry = entry;
  };
  container.addEventListener('focusin', onFocusIn);

  install();

  return () => {
    container.removeEventListener('focusin', onFocusIn);
    const idx = entries.indexOf(entry);
    if (idx >= 0) entries.splice(idx, 1);
    if (lastFocusedEntry === entry) lastFocusedEntry = null;
  };
}

function isTypingInInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
}

function install() {
  if (installed) return;
  if (typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'o') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (isTypingInInput(e.target)) return;

    const entry = lastFocusedEntry ?? entries[0];
    if (!entry) return;

    const focusedId = entry.handle.getFocusedNavId();
    const selector = focusedId
      ? `[data-nav-id="${CSS.escape(focusedId)}"]`
      : '[role="treeitem"]';
    const el = entry.container.querySelector<HTMLElement>(selector);
    if (!el) return;

    el.focus();
    e.preventDefault();
  });
}
