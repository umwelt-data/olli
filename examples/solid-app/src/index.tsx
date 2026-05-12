import { createRoot } from 'solid-js';
import { createNavigationRuntime, registerDomain } from 'olli-core';
import type { VisPayload, UnitOlliVisSpec } from 'olli-vis';
import { visDomain, elaborateSpec, lowerVisSpec } from 'olli-vis';
import { TreeView, registerDefaultKeybindings } from 'olli-render-solid';
import { render } from 'solid-js/web';

const spec: UnitOlliVisSpec = {
  data: [
    { month: 'Jan', sales: 120 },
    { month: 'Feb', sales: 180 },
    { month: 'Mar', sales: 150 },
    { month: 'Apr', sales: 210 },
    { month: 'May', sales: 170 },
  ],
  mark: 'line',
  title: 'Monthly Sales',
  fields: [
    { field: 'month', type: 'ordinal' },
    { field: 'sales', type: 'quantitative' },
  ],
  axes: [
    { field: 'month', axisType: 'x', title: 'Month' },
    { field: 'sales', axisType: 'y', title: 'Sales ($)' },
  ],
};

export function createVisRuntime() {
  const elaborated = elaborateSpec(spec);
  const graph = lowerVisSpec(elaborated);
  const runtime = createNavigationRuntime<VisPayload>(graph);
  registerDomain(runtime, visDomain);
  registerDefaultKeybindings(runtime);
  runtime.customization.applyPreset('medium');
  return runtime;
}

export function mountSolidApp(container: HTMLElement): () => void {
  const runtime = createVisRuntime();
  return render(() => <TreeView runtime={runtime} />, container);
}
