import type { TipoPersona } from './rfc.js';

/**
 * SAT's c_RegimenFiscal, with the persona types each régimen accepts. Moved
 * from the CFDI module (N-33) so the portal can offer and check the same list.
 */
export const REGIMEN_FISCAL: Readonly<Record<string, readonly TipoPersona[]>> = {
  '601': ['moral'],
  '603': ['moral'],
  '605': ['fisica'],
  '606': ['fisica'],
  '607': ['fisica'],
  '608': ['fisica'],
  '610': ['moral', 'fisica'],
  '611': ['fisica'],
  '612': ['fisica'],
  '614': ['fisica'],
  '615': ['fisica'],
  '616': ['fisica'],
  '620': ['moral'],
  '621': ['fisica'],
  '622': ['moral'],
  '623': ['moral'],
  '624': ['moral'],
  '625': ['fisica'],
  '626': ['moral', 'fisica'],
} as const;
