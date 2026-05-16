import type { Customization, RecipeEntry } from 'olli-core';
import type { OlliNodeType } from '../spec/types.js';

type RoleTokens = Record<OlliNodeType, string[]>;

const roleTokenMap: RoleTokens = {
  root: ['name', 'visType', 'visSize', 'children'],
  view: ['name', 'visType', 'children'],
  xAxis: ['name', 'visType', 'visData', 'parent', 'aggregate'],
  yAxis: ['name', 'visType', 'visData', 'parent', 'aggregate'],
  legend: ['name', 'visType', 'visData', 'parent', 'aggregate'],
  guide: ['name', 'visType', 'visData', 'parent'],
  filteredData: ['visData', 'visSize', 'parent', 'aggregate', 'quartile', 'instructions'],
  annotations: ['name', 'visSize'],
  other: ['visData', 'visSize', 'instructions'],
};

function makeRecipe(tokens: string[], brevity: 'short' | 'long'): RecipeEntry[] {
  return tokens.map((token) => ({ token, brevity }));
}

function makePreset(
  name: string,
  roles: RoleTokens,
  brevity: 'short' | 'long',
  extras?: Partial<Record<OlliNodeType, string[]>>,
): { name: string; customizations: Customization[] } {
  const customizations: Customization[] = [];
  for (const [role, tokens] of Object.entries(roles) as [OlliNodeType, string[]][]) {
    const merged = extras?.[role] ? [...tokens, ...extras[role]] : tokens;
    customizations.push({
      role,
      recipe: makeRecipe(merged, brevity),
      duration: 'persistent',
    });
  }
  return { name, customizations };
}

const detailedRoles: RoleTokens = {
  root: ['name', 'visType', 'visSize', 'children'],
  view: ['name', 'visType', 'children'],
  xAxis: ['name', 'visType', 'visData', 'parent', 'aggregate'],
  yAxis: ['name', 'visType', 'visData', 'parent', 'aggregate'],
  legend: ['name', 'visType', 'visData', 'parent', 'aggregate'],
  guide: ['name', 'visType', 'visData', 'parent'],
  filteredData: ['visData', 'visSize', 'parent', 'aggregate', 'quartile', 'instructions'],
  annotations: ['name', 'visSize'],
  other: ['visData', 'visSize', 'instructions'],
};

const standardRoles: RoleTokens = {
  root: ['name', 'visType', 'children'],
  view: ['name', 'visType'],
  xAxis: ['name', 'visData', 'aggregate'],
  yAxis: ['name', 'visData', 'aggregate'],
  legend: ['name', 'visData', 'aggregate'],
  guide: ['name', 'visData'],
  filteredData: ['visData', 'visSize', 'aggregate', 'instructions'],
  annotations: ['name', 'visSize'],
  other: ['visData', 'visSize', 'instructions'],
};

const minimalRoles: RoleTokens = {
  root: ['name', 'visType'],
  view: ['name'],
  xAxis: ['name', 'visData'],
  yAxis: ['name', 'visData'],
  legend: ['name', 'visData'],
  guide: ['name'],
  filteredData: ['visData', 'visSize'],
  annotations: ['name'],
  other: ['visData'],
};

export function visPresets(): { name: string; customizations: Customization[] }[] {
  return [
    makePreset('detailed', detailedRoles, 'long'),
    makePreset('standard', standardRoles, 'short'),
    makePreset('minimal', minimalRoles, 'short'),
  ];
}
