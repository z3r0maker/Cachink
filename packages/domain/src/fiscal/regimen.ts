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

/**
 * c_UsoCFDI values valid on an income (tipo I) CFDI. CP01 (pagos) and CN01
 * (nómina) are excluded on purpose. D01–D10 are deducciones personales:
 * persona física only.
 */
export const USO_CFDI_INGRESO = [
  'G01',
  'G02',
  'G03',
  'I01',
  'I02',
  'I03',
  'I04',
  'I05',
  'I06',
  'I07',
  'I08',
  'D01',
  'D02',
  'D03',
  'D04',
  'D05',
  'D06',
  'D07',
  'D08',
  'D09',
  'D10',
  'S01',
] as const;
export type UsoCfdi = (typeof USO_CFDI_INGRESO)[number];

/** The uso when the owner has not picked one: gastos en general (portal and CFDI). */
export const USO_CFDI_DEFAULT: UsoCfdi = 'G03';
