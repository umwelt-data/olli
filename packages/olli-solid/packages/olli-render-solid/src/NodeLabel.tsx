import type { NavigationRuntime, NavNodeId } from 'olli-core';

export function NodeLabel<P>(props: {
  runtime: NavigationRuntime<P>;
  navId: NavNodeId;
}) {
  const desc = props.runtime.getDescriptionFor(props.navId);
  return <span class="olli-node-label">{desc()}</span>;
}
