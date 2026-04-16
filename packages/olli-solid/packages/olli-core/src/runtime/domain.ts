import type { Hypergraph } from '../hypergraph/types.js';
import type { Customization } from '../description/customization.js';
import type { DescriptionToken } from '../description/tokens.js';
import type { DialogContribution } from './dialogs.js';
import type { KeybindingContribution } from './keybindings.js';
import type { PredicateProvider } from './predicates.js';
import type { NavigationRuntime } from './runtime.js';

/**
 * A domain module is a self-contained plugin that supplies a lowerer from its
 * spec type to the core hypergraph, plus optional contributions (tokens,
 * presets, keybindings, dialogs, predicate providers).
 */
export interface OlliDomain<Spec, Payload> {
  name: string;
  toHypergraph(spec: Spec): Hypergraph<Payload>;
  tokens?: ReadonlyArray<DescriptionToken<Payload>>;
  presets?: ReadonlyArray<{ name: string; customizations: Customization[] }>;
  keybindings?: ReadonlyArray<KeybindingContribution<Payload>>;
  dialogs?: ReadonlyArray<DialogContribution<Payload>>;
  predicateProviders?: ReadonlyArray<PredicateProvider<Payload>>;
}

/** Register all contributions from a domain onto a runtime. */
export function registerDomain<Spec, Payload>(
  runtime: NavigationRuntime<Payload>,
  domain: OlliDomain<Spec, Payload>,
): void {
  for (const t of domain.tokens ?? []) runtime.registerToken(t);
  for (const k of domain.keybindings ?? []) runtime.registerKeybinding(k);
  for (const d of domain.dialogs ?? []) runtime.registerDialog(d);
  for (const p of domain.predicateProviders ?? []) runtime.registerPredicateProvider(p);
  for (const preset of domain.presets ?? []) {
    runtime.customization.registerPreset(preset.name, preset.customizations);
  }
}
