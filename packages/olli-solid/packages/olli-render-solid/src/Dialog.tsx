import { Show, createEffect, type ParentProps } from 'solid-js';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog(
  props: ParentProps<{
    open: boolean;
    onClose: () => void;
    titleId?: string;
  }>,
) {
  let dialogEl: HTMLDivElement | undefined;
  let prevFocus: Element | null = null;

  createEffect(() => {
    if (props.open && dialogEl) {
      prevFocus = document.activeElement;
      const first = dialogEl.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (first ?? dialogEl).focus();
    } else if (!props.open && prevFocus instanceof HTMLElement) {
      prevFocus.focus();
      prevFocus = null;
    }
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      props.onClose();
      return;
    }
    if (e.key === 'Tab' && dialogEl) {
      const focusables = Array.from(
        dialogEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <Show when={props.open}>
      <div class="olli-dialog-overlay" onClick={() => props.onClose()}>
        <div
          ref={dialogEl}
          role="dialog"
          aria-modal="true"
          aria-labelledby={props.titleId}
          class="olli-dialog"
          tabindex={-1}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
        >
          {props.children}
        </div>
      </div>
    </Show>
  );
}
