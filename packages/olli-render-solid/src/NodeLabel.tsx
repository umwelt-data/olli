import { type JSX } from 'solid-js';
import type { NavigationRuntime, NavNodeId } from 'olli-core';

function parseInlineCode(text: string): JSX.Element[] {
  const parts: JSX.Element[] = [];
  const regex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index) as unknown as JSX.Element);
    }
    parts.push(<code>{match[1]}</code> as JSX.Element);
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex) as unknown as JSX.Element);
  }
  return parts;
}

function stripBackticks(text: string): string {
  return text.replace(/`([^`]+)`/g, '$1');
}

export function NodeLabel<P>(props: {
  runtime: NavigationRuntime<P>;
  navId: NavNodeId;
}) {
  const desc = props.runtime.getDescriptionFor(props.navId);
  const onClick = () => {
    if (props.runtime.focusedNavId() === props.navId) {
      props.runtime.moveFocus('down');
    } else {
      props.runtime.focus(props.navId);
    }
  };
  return (
    <span class="olli-node-label" onClick={onClick} aria-label={stripBackticks(desc())}>
      {parseInlineCode(desc())}
    </span>
  );
}
