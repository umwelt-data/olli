import type { Customization, RecipeEntry } from 'olli-core';
import type { OlliNodeType } from '../spec/types.js';

type RoleTokens = Record<OlliNodeType, string[]>;

const roleTokenMap: RoleTokens = {
  root: ['visName', 'visType', 'visSizeToken', 'visChildren'],
  view: ['visName', 'visType', 'visChildren'],
  xAxis: ['visName', 'visType', 'visData', 'visParent', 'aggregate'],
  yAxis: ['visName', 'visType', 'visData', 'visParent', 'aggregate'],
  legend: ['visName', 'visType', 'visData', 'visParent', 'aggregate'],
  guide: ['visName', 'visType', 'visData', 'visParent'],
  filteredData: ['visData', 'visSize', 'visParent', 'aggregate', 'quartile', 'instructions'],
  annotations: ['visName', 'visSize'],
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

const highRoles: RoleTokens = {
  root: ['visName', 'visType', 'visSize', 'visChildren'],
  view: ['visName', 'visType', 'visChildren'],
  xAxis: ['visName', 'visType', 'visData', 'visParent', 'aggregate'],
  yAxis: ['visName', 'visType', 'visData', 'visParent', 'aggregate'],
  legend: ['visName', 'visType', 'visData', 'visParent', 'aggregate'],
  guide: ['visName', 'visType', 'visData', 'visParent'],
  filteredData: ['visData', 'visSize', 'visParent', 'aggregate', 'quartile', 'instructions'],
  annotations: ['visName', 'visSize'],
  other: ['visData', 'visSize', 'instructions'],
};

const mediumRoles: RoleTokens = {
  root: ['visName', 'visType', 'visChildren'],
  view: ['visName', 'visType'],
  xAxis: ['visName', 'visData', 'aggregate'],
  yAxis: ['visName', 'visData', 'aggregate'],
  legend: ['visName', 'visData', 'aggregate'],
  guide: ['visName', 'visData'],
  filteredData: ['visData', 'visSize', 'aggregate', 'instructions'],
  annotations: ['visName', 'visSize'],
  other: ['visData', 'visSize', 'instructions'],
};

const lowRoles: RoleTokens = {
  root: ['visName', 'visType'],
  view: ['visName'],
  xAxis: ['visName', 'visData'],
  yAxis: ['visName', 'visData'],
  legend: ['visName', 'visData'],
  guide: ['visName'],
  filteredData: ['visData', 'visSize'],
  annotations: ['visName'],
  other: ['visData'],
};

export function visPresets(): { name: string; customizations: Customization[] }[] {
  return [
    makePreset('high', highRoles, 'long'),
    makePreset('medium', mediumRoles, 'short'),
    makePreset('low', lowRoles, 'short'),
  ];
}
