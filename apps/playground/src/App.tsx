import { createSignal, createMemo, For, Switch, Match } from 'solid-js';
import { examples, findExample } from '../../docs/gallery/examples/index.js';
import type { VisualizationExample, DiagramExample } from '../../docs/gallery/examples/types.js';
import { VisualizationRenderer } from './VisualizationRenderer.js';
import { DiagramRenderer } from './DiagramRenderer.js';
import { KeyPressOverlay } from './KeyPressOverlay.js';

export function App() {
  const [selectedId, setSelectedId] = createSignal(examples[0]!.id);
  const selectedExample = createMemo(() => findExample(selectedId())!);

  const visExamples = examples.filter((e) => e.domain === 'visualization');
  const diagramExamples = examples.filter((e) => e.domain === 'diagram');

  return (
    <div class="playground">
      <header class="playground-header">
        <h1>Olli Playground</h1>
        <select
          value={selectedId()}
          onChange={(e) => setSelectedId(e.currentTarget.value)}
        >
          <optgroup label="Visualizations">
            <For each={visExamples}>
              {(ex) => <option value={ex.id}>{ex.title}</option>}
            </For>
          </optgroup>
          <optgroup label="Diagrams">
            <For each={diagramExamples}>
              {(ex) => <option value={ex.id}>{ex.title}</option>}
            </For>
          </optgroup>
        </select>
      </header>

      <Switch>
        <Match when={selectedExample().domain === 'visualization'}>
          <VisualizationRenderer example={selectedExample() as VisualizationExample} />
        </Match>
        <Match when={selectedExample().domain === 'diagram'}>
          <DiagramRenderer example={selectedExample() as DiagramExample} />
        </Match>
      </Switch>

      <KeyPressOverlay />
    </div>
  );
}
