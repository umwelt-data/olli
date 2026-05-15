import { createSignal, onCleanup, onMount } from 'solid-js';

const KEY_MAP: Record<string, string> = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  ' ': 'Space',
  Escape: 'Esc',
};

const MODIFIERS = new Set(['Control', 'Shift', 'Alt', 'Meta']);

function formatKey(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.metaKey) parts.push('Cmd');
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');

  if (!MODIFIERS.has(e.key)) {
    parts.push(KEY_MAP[e.key] ?? e.key);
  }

  return parts.join(' + ') || e.key;
}

export function KeyPressOverlay() {
  const [label, setLabel] = createSignal('');
  const [visible, setVisible] = createSignal(false);
  let timeoutId: number | undefined;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (MODIFIERS.has(e.key)) return;

    setLabel(formatKey(e));
    setVisible(true);

    if (timeoutId !== undefined) clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => setVisible(false), 1500);
  };

  onMount(() => document.addEventListener('keydown', handleKeyDown));
  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown);
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  });

  return (
    <div
      class="key-press-overlay"
      classList={{ 'key-press-overlay--visible': visible() }}
    >
      {label()}
    </div>
  );
}
