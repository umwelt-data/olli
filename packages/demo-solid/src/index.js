import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import { render } from 'solid-js/web';
import html from 'solid-js/html';
import * as vega from 'vega';
import * as vegaLite from 'vega-lite';
import { olli } from 'olli';
import { VegaLiteAdapter } from 'olli-adapters';
import { vegaLiteExamples } from './example-data';
import './styles.css';

function App() {
  const [selectedId, setSelectedId] = createSignal(vegaLiteExamples[0]?.id ?? '');
  const [status, setStatus] = createSignal('Rendering example...');
  const [errorMessage, setErrorMessage] = createSignal('');
  let chartRef;
  let olliRef;

  const currentExample = createMemo(() => {
    return vegaLiteExamples.find((example) => example.id === selectedId()) ?? vegaLiteExamples[0];
  });

  const currentLabel = createMemo(() => {
    const example = currentExample();
    return example?.developmentOnly ? `${example?.title} / lab build` : example?.title ?? 'Example';
  });

  createEffect(() => {
    const example = currentExample();

    if (!example || !chartRef || !olliRef) {
      return;
    }

    let disposed = false;
    let view;

    chartRef.innerHTML = '';
    olliRef.innerHTML = '';
    setErrorMessage('');
    setStatus(`Rendering ${example.title}...`);

    const renderExample = async () => {
      try {
        const compiled = vegaLite.compile(example.spec).spec;
        const runtime = vega.parse(compiled);

        view = new vega.View(runtime)
          .logLevel(vega.Warn)
          .initialize(chartRef)
          .renderer('svg')
          .hover();

        await view.runAsync();

        const olliSpec = await VegaLiteAdapter(example.spec);

        if (disposed) {
          return;
        }

        olliRef.appendChild(olli(olliSpec));
        setStatus(`Showing ${example.title}`);
      } catch (error) {
        if (disposed) {
          return;
        }

        const message = error instanceof Error ? error.message : String(error);
        setErrorMessage(message);
        setStatus(`Could not render ${example.title}`);
      }
    };

    renderExample();

    onCleanup(() => {
      disposed = true;

      if (view) {
        view.finalize();
      }

      if (chartRef) {
        chartRef.innerHTML = '';
      }

      if (olliRef) {
        olliRef.innerHTML = '';
      }
    });
  });

  const handleSelectChange = (event) => {
    setSelectedId(event.currentTarget.value);
  };

  return html`
    <main class="dashboard-shell">
      <section class="hero-card">
        <div class="hero-copy-block">
          <p class="eyebrow">Accessibility Preview Studio</p>
          <h1>Olli Demo Dashboard</h1>
          <p class="hero-copy">
            A single place to move between the repo's Vega-Lite examples, compare the visual grammar with Olli's
            generated structure, and use the pair as a live demo environment.
          </p>
          <div class="hero-tags">
            <span class="hero-tag">Live chart preview</span>
            <span class="hero-tag">Repo-sourced examples</span>
            <span class="hero-tag">Olli tree output</span>
            <span class="hero-tag">Example browser</span>
          </div>
        </div>
        <div class="control-card">
          <p class="field-label">Now Loaded</p>
          <p class="selected-title">${() => currentLabel()}</p>
          <label class="field-label" for="example-select">Switch Example</label>
          <select id="example-select" class="select-input" value=${selectedId()} onChange=${handleSelectChange}>
            ${vegaLiteExamples.map((example) => html`
              <option value=${example.id}>
                ${example.title}${example.developmentOnly ? ' (development)' : ''}
              </option>
            `)}
          </select>
          <p class="status-line">${status()}</p>
        </div>
      </section>

      <section class="summary-grid">
        <article class="summary-card">
          <span class="summary-label">Example Count</span>
          <strong>${vegaLiteExamples.length}</strong>
        </article>
        <article class="summary-card">
          <span class="summary-label">Source File</span>
          <strong>${() => currentExample()?.codePath ?? 'n/a'}</strong>
        </article>
        <article class="summary-card">
          <span class="summary-label">Gallery Route</span>
          <strong>${() => currentExample()?.galleryUrl ?? 'n/a'}</strong>
        </article>
      </section>

      <section class="panel-grid">
        <article class="panel">
          <div class="panel-header">
            <div>
              <p class="panel-kicker">Chart View</p>
              <h2>${() => currentLabel()}</h2>
            </div>
          </div>
          <div class="viz-surface" ref=${(element) => (chartRef = element)}></div>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <p class="panel-kicker">Assistive Structure</p>
              <h2>Olli Accessibility Tree</h2>
            </div>
          </div>
          <div class="tree-surface" ref=${(element) => (olliRef = element)}></div>
        </article>
      </section>

      <section class="panel-grid secondary">
        <article class="panel">
          <div class="panel-header">
            <div>
              <p class="panel-kicker">Spec Object</p>
              <h2>Extracted Vega-Lite Spec</h2>
            </div>
          </div>
          <pre class="code-block"><code>${() => currentExample()?.specSource ?? ''}</code></pre>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <p class="panel-kicker">Original File</p>
              <h2>Repo Example HTML</h2>
            </div>
          </div>
          <pre class="code-block"><code>${() => currentExample()?.htmlSource ?? ''}</code></pre>
        </article>
      </section>

      ${() =>
        errorMessage()
          ? html`
              <section class="error-banner" role="alert">
                <strong>Render error:</strong> ${errorMessage()}
              </section>
            `
          : ''}
    </main>
  `;
}

render(App, document.getElementById('app'));
