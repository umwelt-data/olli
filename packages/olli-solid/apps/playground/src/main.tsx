import { createSignal, onCleanup, createEffect, For } from 'solid-js';
import { render } from 'solid-js/web';
import type { OlliHandle } from 'olli-js';
import { examples } from './examples.js';

function App() {
  const [activeIndex, setActiveIndex] = createSignal(0);
  let containerRef!: HTMLDivElement;
  let handle: OlliHandle | undefined;

  createEffect(() => {
    const idx = activeIndex();
    const example = examples[idx]!;

    if (handle) {
      handle.destroy();
      handle = undefined;
    }

    handle = example.mount(containerRef);
  });

  onCleanup(() => {
    handle?.destroy();
  });

  return (
    <>
      <nav>
        <For each={examples}>
          {(example, i) => (
            <button
              aria-pressed={activeIndex() === i()}
              onClick={() => setActiveIndex(i())}
            >
              {example.name}
            </button>
          )}
        </For>
      </nav>
      <div id="example-container" ref={containerRef} />
    </>
  );
}

const nav = document.getElementById('nav');
if (nav) nav.remove();
const container = document.getElementById('example-container');
if (container) container.remove();

render(() => <App />, document.body.querySelector('h1')?.parentElement ?? document.body);
