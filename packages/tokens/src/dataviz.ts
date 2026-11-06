/**
 * The data palette (OD-6, approved 2026-10-08 on the «Paleta de datos»
 * board; ADR-133). Charts only: yellow and black stay brand and action
 * colours and never encode data.
 *
 * Every adjacent pair passes the dataviz validator (worst CVD ΔE 9.2, worst
 * normal-vision ΔE 16.3). `ingreso` and `administracion` sit below 3:1 on
 * white, so a mark in either always carries its label; `ingreso` next to
 * `perdida` always carries a + or − sign.
 */
export const dataviz = {
  /** Money in. */
  ingreso: '#1BAF7A',
  /** What remains at each level of a cascade. */
  restante: '#2A78D6',
  /** Losses, cancellations, refunds. */
  perdida: '#E34948',
  /** Taxes and financial results. */
  impuesto: '#8A8984',
  costoServicio: '#EB6834',
  ventasMarketing: '#4A3AA7',
  desarrollo: '#008300',
  administracion: '#E87BA4',
} as const;

export type DatavizToken = keyof typeof dataviz;
