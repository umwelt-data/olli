import type { DiagramExample } from '../types.js';

// Inlined from olli-diagram/src/examples/pulleyMedium.ts. We copy rather than
// import because [id].paths.ts is loaded in a Node context that doesn't rewrite
// the `.js` imports in olli-diagram's TypeScript source to their `.ts` targets.
// The pulley spec is documentation-stable (from Cheng 1999, used in Benthic); a
// rare upstream change can be mirrored here.
interface DiagramEdge {
  id: string;
  displayName: string;
  description?: string;
  parents: string[];
  children: string[];
}

function edge(
  id: string,
  displayName: string,
  description: string | undefined,
  parents: string[],
  children: string[],
): DiagramEdge {
  const e: DiagramEdge = { id, displayName, children, parents };
  if (description !== undefined) e.description = description;
  return e;
}

const spec = {
  edges: [
    edge('0', 'Pulley diagram', 'A mechanical system consisting of pulleys, ropes, and boxes.', [], [
      '1', '2', '3', '4', '5', '6', '7', '18', '19', '20', '21', '22', '23', '24', '25',
    ]),
    edge('1', 'Pulley System A', 'Contains 3 objects.', ['0'], ['12', '8', '13']),
    edge('2', 'Pulley System B', 'Contains 3 objects.', ['0'], ['14', '9', '15']),
    edge('3', 'Pulley System C', 'Contains 3 objects.', ['0'], ['16', '10', '17']),
    edge('4', 'Box B1', 'Weight of 4 units.', ['0', '18'], []),
    edge('5', 'Box B2', undefined, ['0', '23'], []),
    edge('6', 'Ceiling', undefined, ['0', '20'], []),
    edge('7', 'Floor', undefined, ['0', '24', '25'], []),
    edge('8', 'Pulley A', undefined, ['1', '19'], []),
    edge('9', 'Pulley B', undefined, ['2', '21'], []),
    edge('10', 'Pulley C', undefined, ['3', '22'], []),
    edge('11', 'Rope p', undefined, ['19', '20'], []),
    edge('12', 'Rope q', undefined, ['1', '18'], []),
    edge('13', 'Rope r', undefined, ['1', '21'], []),
    edge('14', 'Rope s', undefined, ['2', '24'], []),
    edge('15', 'Rope t', undefined, ['2', '22'], []),
    edge('16', 'Rope u', undefined, ['3', '25'], []),
    edge('17', 'Rope v', undefined, ['3', '23'], []),
    edge('18', 'Box B1 hangs from Rope q', 'Contains 2 objects.', ['0'], ['4', '12']),
    edge('19', 'Pulley A hangs from Rope p', 'Contains 2 objects.', ['0'], ['8', '11']),
    edge('20', 'Rope p hangs from Ceiling', 'Contains 2 objects.', ['0'], ['6', '11']),
    edge('21', 'Pulley B hangs from Rope r', 'Contains 2 objects.', ['0'], ['9', '13']),
    edge('22', 'Pulley C hangs from Rope t', 'Contains 2 objects.', ['0'], ['10', '15']),
    edge('23', 'Box B2 hangs from Rope v', 'Contains 2 objects.', ['0'], ['5', '17']),
    edge('24', 'Rope s is anchored to Floor', 'Contains 2 objects.', ['0'], ['14', '7']),
    edge('25', 'Rope u is anchored to Floor', 'Contains 2 objects.', ['0'], ['16', '7']),
  ],
};

const svg = `
<svg viewBox="0 0 520 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Schematic of three stacked pulley systems">
  <style>
    .frame { stroke: var(--vp-c-text-1, #1a1a1a); stroke-width: 2; fill: none; }
    .rope { stroke: var(--vp-c-text-2, #666); stroke-width: 1.5; fill: none; }
    .pulley { fill: var(--vp-c-bg, #fff); stroke: var(--vp-c-text-1, #1a1a1a); stroke-width: 2; }
    .box { fill: var(--vp-c-bg-soft, #f0f0f0); stroke: var(--vp-c-text-1, #1a1a1a); stroke-width: 1.5; }
    .label { font-family: var(--vp-font-family-base, sans-serif); font-size: 11px; fill: var(--vp-c-text-1, #1a1a1a); }
    .rope-label { font-family: var(--vp-font-family-mono, monospace); font-size: 10px; fill: var(--vp-c-text-2, #666); font-style: italic; }
    .system-label { font-family: var(--vp-font-family-base, sans-serif); font-size: 12px; font-weight: 600; fill: var(--vp-c-brand-1, #3451b2); }
  </style>

  <line class="frame" x1="20" y1="20" x2="500" y2="20" />
  <text class="label" x="260" y="14" text-anchor="middle">Ceiling</text>

  <line class="rope" x1="100" y1="20" x2="100" y2="80" />
  <text class="rope-label" x="106" y="55">p</text>

  <circle class="pulley" cx="100" cy="100" r="20" />
  <text class="label" x="100" y="104" text-anchor="middle">A</text>
  <text class="system-label" x="140" y="90">System A</text>

  <line class="rope" x1="80" y1="100" x2="60" y2="160" />
  <text class="rope-label" x="50" y="135">q</text>
  <rect class="box" x="40" y="160" width="40" height="30" rx="2" />
  <text class="label" x="60" y="179" text-anchor="middle">B1</text>

  <line class="rope" x1="120" y1="100" x2="260" y2="180" />
  <text class="rope-label" x="195" y="138">r</text>

  <circle class="pulley" cx="260" cy="200" r="20" />
  <text class="label" x="260" y="204" text-anchor="middle">B</text>
  <text class="system-label" x="300" y="190">System B</text>

  <line class="rope" x1="240" y1="200" x2="220" y2="380" />
  <text class="rope-label" x="210" y="300">s</text>

  <line class="rope" x1="280" y1="200" x2="420" y2="260" />
  <text class="rope-label" x="355" y="225">t</text>

  <circle class="pulley" cx="420" cy="280" r="20" />
  <text class="label" x="420" y="284" text-anchor="middle">C</text>
  <text class="system-label" x="340" y="280">System C</text>

  <line class="rope" x1="400" y1="280" x2="380" y2="380" />
  <text class="rope-label" x="370" y="330">u</text>

  <line class="rope" x1="440" y1="280" x2="460" y2="330" />
  <text class="rope-label" x="466" y="310">v</text>
  <rect class="box" x="440" y="330" width="40" height="30" rx="2" />
  <text class="label" x="460" y="349" text-anchor="middle">B2</text>

  <line class="frame" x1="20" y1="380" x2="500" y2="380" />
  <text class="label" x="260" y="400" text-anchor="middle">Floor</text>
</svg>
`;

export const pulleyMedium: DiagramExample = {
  id: 'pulley-medium',
  title: 'Pulley system (medium)',
  domain: 'diagram',
  tags: ['pulley', 'hypergraph', 'multi-parent'],
  description:
    'Three pulley systems with shared ropes and boxes. Reach a shared rope from one system, arrow sideways to the virtual parent-context sibling to switch into another system.',
  spec,
  svg,
};
