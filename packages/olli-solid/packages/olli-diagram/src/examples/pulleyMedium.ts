import type { Hyperedge } from 'olli-core';
import type { DiagramPayload, DiagramSpec } from '../spec/types.js';

/**
 * Medium pulley system from Cheng (1999) / Benthic user study (Mei et al.
 * ASSETS '25). See `plan/03-pulley-acceptance.md` §2 for the source table.
 * IDs and structure are verbatim; note the intentional ordering of each
 * edge's parents list — the first parent is the "default" for ascent.
 */
function edge(
  id: string,
  displayName: string,
  description: string | undefined,
  parents: string[],
  children: string[],
): Hyperedge<DiagramPayload> {
  const e: Hyperedge<DiagramPayload> = { id, displayName, children, parents };
  if (description !== undefined) e.description = description;
  return e;
}

export const pulleyMedium: DiagramSpec = {
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
