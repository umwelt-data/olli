import type { OlliDataset, OlliDatum } from 'olli-vis';
import { US_STATES, US_COUNTIES } from './us-fips.js';

export function enrichWithUSGeo(data: OlliDataset, idField: string): OlliDataset {
  return data.map((d) => {
    const raw = d[idField];
    if (raw == null) return d;
    const id = String(raw).padStart(5, '0');
    const out: OlliDatum = { ...d };

    if (id.length === 5) {
      const county = US_COUNTIES[id];
      if (county) {
        out['county_name'] = county.name;
        const state = US_STATES[county.stateFips];
        if (state) {
          out['state_name'] = state.name;
          out['region'] = state.region;
        }
        return out;
      }
    }

    const stateFips = id.length <= 2 ? id.padStart(2, '0') : id.slice(0, 2);
    const state = US_STATES[stateFips];
    if (state) {
      out['state_name'] = state.name;
      out['region'] = state.region;
    }

    return out;
  });
}

export function looksLikeFips(data: OlliDataset, idField: string): boolean {
  if (!data.length) return false;
  const sample = data.slice(0, Math.min(20, data.length));
  return sample.every((d) => {
    const v = d[idField];
    if (v == null) return false;
    const s = String(v);
    return /^\d{1,5}$/.test(s);
  });
}
