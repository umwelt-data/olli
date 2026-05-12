import type { DescriptionToken } from 'olli-core';
import type { DiagramPayload } from '../spec/types.js';

export const elementKindToken: DescriptionToken<DiagramPayload> = {
  name: 'elementKind',
  applicableRoles: ['element'],
  compute: (ctx) => {
    const kind = ctx.edge?.payload?.sourceElement?.kind;
    if (!kind) return { short: '', long: '' };
    return { short: kind, long: kind };
  },
};
