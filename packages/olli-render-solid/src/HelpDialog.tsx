import { For, Show, createSignal } from 'solid-js';
import type {
  DialogContribution,
  DialogRenderResult,
  NavigationRuntime,
  NavNode,
} from 'olli-core';

type OS = 'mac' | 'windows';

function detectOS(): OS {
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent ?? '';
    if (/Win/i.test(ua)) return 'windows';
  }
  return 'mac';
}

function formatKey(key: string): string {
  switch (key) {
    case ' ': return 'Space';
    case 'ArrowUp': return 'Up Arrow';
    case 'ArrowDown': return 'Down Arrow';
    case 'ArrowLeft': return 'Left Arrow';
    case 'ArrowRight': return 'Right Arrow';
    default: return key;
  }
}

interface HelpEntry {
  key: string;
  label: string;
}

interface HelpGroup {
  name: string;
  entries: HelpEntry[];
}

function buildKeybindingGroups<P>(runtime: NavigationRuntime<P>): HelpGroup[] {
  const groupMap = new Map<string, HelpEntry[]>();
  const groupOrder: string[] = [];

  for (const binding of runtime.keybindings.list()) {
    if (!binding.label || !binding.group) continue;
    const dedupeKey = `${binding.key}::${binding.label}`;
    let entries = groupMap.get(binding.group);
    if (!entries) {
      entries = [];
      groupMap.set(binding.group, entries);
      groupOrder.push(binding.group);
    }
    if (entries.some((e) => `${e.key}::${e.label}` === dedupeKey)) continue;
    entries.push({ key: formatKey(binding.key), label: binding.label });
  }

  const dialogEntries: HelpEntry[] = [];
  for (const dialog of runtime.dialogs.list()) {
    if (!dialog.triggerKey) continue;
    dialogEntries.push({
      key: formatKey(dialog.triggerKey),
      label: `Open ${dialog.label}`,
    });
  }
  if (dialogEntries.length > 0) {
    groupMap.set('Dialogs', dialogEntries);
    groupOrder.splice(1, 0, 'Dialogs');
  }

  return groupOrder.map((name) => ({ name, entries: groupMap.get(name)! }));
}

export function helpDialog<P>(): DialogContribution<P> {
  return {
    id: 'help',
    label: 'help',
    triggerKey: '?',
    render: (runtime: NavigationRuntime<P>, _navNode: NavNode): DialogRenderResult => {
      const [os, setOS] = createSignal<OS>(detectOS());
      const groups = buildKeybindingGroups(runtime);

      return {
        title: 'Help',
        content: (
          <div class="olli-help-dialog">
            <p>
              Olli is a screen reader accessible tool for exploring data visualizations as interactive, navigable descriptions.
              Learn more at{' '}
              <a
                href="https://umwelt-data.github.io/olli/"
                target="_blank"
                rel="noopener"
              >
                umwelt-data.github.io/olli
              </a>
              .
            </p>

            <h3>Screen reader setup</h3>
            <div>
              <label>
                Operating system:{' '}
                <select
                  value={os()}
                  onChange={(e) => setOS(e.currentTarget.value as OS)}
                >
                  <option value="mac">macOS</option>
                  <option value="windows">Windows</option>
                </select>
              </label>
            </div>
            <Show when={os() === 'mac'}>
              <h4>VoiceOver</h4>
              <p>
                Turn off Quick Nav (press Left Arrow + Right Arrow together) so
                that single-key shortcuts reach Olli.
              </p>
            </Show>
            <Show when={os() === 'windows'}>
              <h4>NVDA</h4>
              <p>
                Use Focus mode to enable Olli keyboard commands. Toggle manually with NVDA+Space.
              </p>
              <h4>JAWS</h4>
              <p>
                Use Forms mode to enable Olli keyboard commands. Enable manually by pressing Enter on the Olli description.
              </p>
            </Show>

            <h3>Keyboard shortcuts</h3>
            <For each={groups}>
              {(group) => (
                <>
                  <h4>{group.name}</h4>
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Key</th>
                        <th scope="col">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={group.entries}>
                        {(entry) => (
                          <tr>
                            <td>
                              <kbd>{entry.key}</kbd>
                            </td>
                            <td>{entry.label}</td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </>
              )}
            </For>
            <p>
              Feedback or suggestions? Fill out the <a 
                href="https://github.com/umwelt-data/olli/issues/new?labels=user%20feedback"
                target="_blank"
                rel="noopener">feedback form on Github</a>.
            </p>
          </div>
        ),
      };
    },
  };
}
