import { BluefishAdapter } from 'olli-adapters';
import type { BluefishKit, BluefishSpecFn } from 'olli-adapters';

const BOX_H = 30;
const V_GAP = 40;
const H_GAP = 40;

const BOX_STYLE = { fill: 'white', stroke: '#94a3b8', 'stroke-width': 1.5, rx: 6 };
const TEXT_STYLE = { 'font-size': '13', fill: '#334155' };
const ARROW_STYLE = { stroke: '#64748b', 'stroke-width': 1.5, bow: 0, straights: true, padStart: 0, padEnd: 15 };

export const architectureSpec: BluefishSpecFn = ({ Align, Arrow, Distribute, Group, Rect, Ref, Text }: BluefishKit) => {
  function box(name: string, label: string, w: number, description?: string) {
    return Align({ name, alignment: 'center', customData: { olli: { label, description } } }, [
      Rect({ width: w, height: BOX_H, ...BOX_STYLE }),
      Text({ ...TEXT_STYLE }, label),
    ]);
  }

  function arrow(from: string, to: string) {
    return Arrow({ ...ARROW_STYLE, customData: { olli: { semantic: 'feeds into' } } }, [
      Ref({ select: from }), Ref({ select: to }),
    ]);
  }

  return [
    // Boxes
    box('ext', 'External spec', 130, 'A visualization or diagram specification'),
    box('adapter', 'Adapter', 85, 'Converts the external format into an Olli spec'),
    box('spec', 'OlliVisSpec / DiagramSpec', 215, 'Olli\'s internal specification format'),
    box('lower', 'Lowerer (domain)', 150, 'Domain-specific logic that converts a spec into a graph'),
    box('hg', 'Hypergraph<Payload>', 175, 'A directed, multi-parent graph representing the visualization or diagram structure'),
    box('runtime', 'Navigation Runtime', 170, 'Manages focus, selection, and expansion state'),
    box('navtree', 'NavTree', 85, 'A navigable tree built from the hypergraph'),
    box('renderer', 'Renderer (Solid.js)', 175, 'Produces the final accessible output'),
    box('aria', 'ARIA tree view', 140, 'The screen-reader-accessible tree view widget'),

    // Horizontal positioning (order matters: each step depends on prior left values).
    // Use 'left' alignment (not 'centerX') so bboxOwners.left is set directly —
    // the Bluefish root forces left=0 on elements whose left isn't directly owned.
    Distribute({ direction: 'horizontal', spacing: H_GAP }, [Ref({ select: 'adapter' }), Ref({ select: 'spec' })]),
    Align({ alignment: 'left' }, [Ref({ select: 'spec' }), Ref({ select: 'lower' }), Ref({ select: 'hg' }), Ref({ select: 'runtime' })]),
    Distribute({ direction: 'horizontal', spacing: H_GAP }, [Ref({ select: 'runtime' }), Ref({ select: 'navtree' })]),
    Align({ alignment: 'left' }, [Ref({ select: 'navtree' }), Ref({ select: 'renderer' })]),
    Distribute({ direction: 'horizontal', spacing: H_GAP }, [Ref({ select: 'renderer' }), Ref({ select: 'aria' })]),
    Align({ alignment: 'left' }, [Ref({ select: 'ext' }), Ref({ select: 'adapter' })]),

    // Vertical positioning (same pattern: use 'top' not 'centerY')
    Distribute({ direction: 'vertical', spacing: V_GAP }, [Ref({ select: 'ext' }), Ref({ select: 'adapter' })]),
    Align({ alignment: 'top' }, [Ref({ select: 'adapter' }), Ref({ select: 'spec' })]),
    Distribute({ direction: 'vertical', spacing: V_GAP }, [Ref({ select: 'spec' }), Ref({ select: 'lower' })]),
    Distribute({ direction: 'vertical', spacing: V_GAP }, [Ref({ select: 'lower' }), Ref({ select: 'hg' })]),
    Distribute({ direction: 'vertical', spacing: V_GAP }, [Ref({ select: 'hg' }), Ref({ select: 'runtime' })]),
    Align({ alignment: 'top' }, [Ref({ select: 'runtime' }), Ref({ select: 'navtree' })]),
    Distribute({ direction: 'vertical', spacing: V_GAP }, [Ref({ select: 'navtree' }), Ref({ select: 'renderer' })]),
    Align({ alignment: 'top' }, [Ref({ select: 'renderer' }), Ref({ select: 'aria' })]),

    // Arrows (unnamed so the adapter creates direct connection relations, not connector elements)
    arrow('ext', 'adapter'),
    arrow('adapter', 'spec'),
    arrow('spec', 'lower'),
    arrow('lower', 'hg'),
    arrow('hg', 'runtime'),
    arrow('runtime', 'navtree'),
    arrow('navtree', 'renderer'),
    arrow('renderer', 'aria'),

    // Semantic groups (for olli accessibility tree)
    Group({ name: 'input', customData: { olli: { label: 'Input', description: 'External formats are converted into Olli\'s internal spec type' } } }, [
      Ref({ select: 'ext' }), Ref({ select: 'adapter' }),
    ]),
    Group({ name: 'specProcessing', customData: { olli: { label: 'Spec processing', description: 'The spec is lowered into a hypergraph data structure' } } }, [
      Ref({ select: 'spec' }), Ref({ select: 'lower' }), Ref({ select: 'hg' }),
    ]),
    Group({ name: 'navigation', customData: { olli: { label: 'Navigation', description: 'Focus and expansion state are managed and a navigable tree is built' } } }, [
      Ref({ select: 'runtime' }), Ref({ select: 'navtree' }),
    ]),
    Group({ name: 'output', customData: { olli: { label: 'Output', description: 'The nav tree is rendered as an accessible ARIA tree view' } } }, [
      Ref({ select: 'renderer' }), Ref({ select: 'aria' }),
    ]),
  ];
};

export const architectureDiagramSpec = BluefishAdapter(architectureSpec);

export async function renderBluefish() {
  const bf = await import('bluefish-js');
  return {
    render: bf.render,
    elements: architectureSpec(bf as unknown as BluefishKit),
  };
}
