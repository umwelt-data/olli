import type { NavigationRuntime, NavNodeId } from 'olli-core';

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
    <span class="olli-node-label" onClick={onClick}>
      {desc()}
    </span>
  );
}
