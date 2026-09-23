/**
 * The 32 federal entities, by their bare ISO 3166-2:MX subdivision code —
 * which is exactly what Vercel's `x-vercel-ip-country-region` sends (measured
 * 2026-09-22: `CHH` for Chihuahua, not `MX-CHH`).
 *
 * Names only for now. N-59 adds the SVG path for each code to the same keys,
 * and `tests/geo-map-data.test.ts` will assert the two sets match, so no state
 * can end up unpaintable or unnamed.
 */
export const MX_STATES = {
  AGU: 'Aguascalientes',
  BCN: 'Baja California',
  BCS: 'Baja California Sur',
  CAM: 'Campeche',
  CHP: 'Chiapas',
  CHH: 'Chihuahua',
  CMX: 'Ciudad de México',
  COA: 'Coahuila',
  COL: 'Colima',
  DUR: 'Durango',
  GUA: 'Guanajuato',
  GRO: 'Guerrero',
  HID: 'Hidalgo',
  JAL: 'Jalisco',
  MEX: 'Estado de México',
  MIC: 'Michoacán',
  MOR: 'Morelos',
  NAY: 'Nayarit',
  NLE: 'Nuevo León',
  OAX: 'Oaxaca',
  PUE: 'Puebla',
  QUE: 'Querétaro',
  ROO: 'Quintana Roo',
  SLP: 'San Luis Potosí',
  SIN: 'Sinaloa',
  SON: 'Sonora',
  TAB: 'Tabasco',
  TAM: 'Tamaulipas',
  TLA: 'Tlaxcala',
  VER: 'Veracruz',
  YUC: 'Yucatán',
  ZAC: 'Zacatecas',
} as const satisfies Record<string, string>;

export type MxStateCode = keyof typeof MX_STATES;

export function isMxState(code: string): code is MxStateCode {
  return Object.hasOwn(MX_STATES, code);
}

/**
 * A code Vercel resolved that we do not recognise is shown as itself rather
 * than dropped: a silently missing state is how a dashboard hides a bug.
 */
export function stateName(code: string): string {
  return isMxState(code) ? MX_STATES[code] : code;
}
