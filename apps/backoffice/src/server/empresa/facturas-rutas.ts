/**
 * The cookie that carries an upload's refusals to «Revisa antes de
 * registrar» (E-11, board CD-06c). Short-lived and scoped to Facturas: what
 * was refused is not stored anywhere else.
 */
export const RECHAZOS_COOKIE = 'empresa_facturas_rechazos';

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Facturas on `mes`, when it is a month, with what the page says after a write. */
export function facturasHref(mes: string, extra: Readonly<Record<string, string>>): string {
  const q = new URLSearchParams(MES.test(mes) ? { mes, ...extra } : extra).toString();
  return q === '' ? '/empresa/facturas' : `/empresa/facturas?${q}`;
}
