import type { OlliDomain } from 'olli-core';
import type { OlliVisSpec, VisPayload } from './spec/types.js';
import { lowerVisSpec } from './lower/lower.js';
import { allVisTokens } from './tokens/index.js';
import { visPredicateProvider } from './predicates.js';
import { visKeybindings } from './keybindings/index.js';
import { visPresets } from './presets/index.js';
import { tableDialog } from './dialogs/table.jsx';
import { filterDialog } from './dialogs/filter.jsx';
import { targetedNavDialog } from './dialogs/targetedNav.jsx';

export const visDomain: OlliDomain<OlliVisSpec, VisPayload> = {
  name: 'olli-vis',
  toHypergraph: lowerVisSpec,
  tokens: allVisTokens(),
  predicateProviders: [visPredicateProvider()],
  keybindings: visKeybindings(),
  presets: visPresets(),
  dialogs: [tableDialog(), filterDialog(), targetedNavDialog()],
};
