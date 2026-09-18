/**
 * The RFC, as SAT defines it (P-08, and the CFDI receptor in N-33).
 *
 * Moved here from `packages/application/src/cfdi` so the portal's Negocio form
 * and the CFDI router validate with one set of rules. What this adds over the
 * CFDI XSD pattern is the **check digit** (the homoclave's last character): a
 * typo in the RFC is caught while the owner is typing it, not when a PAC
 * rejects the invoice.
 */

/** Persona moral: 12-character RFC. Persona física: 13. */
export type TipoPersona = 'moral' | 'fisica';

/** Público en general, and residents abroad: defined by SAT, not computed. */
export const RFC_GENERICO_NACIONAL = 'XAXX010101000';
export const RFC_GENERICO_EXTRANJERO = 'XEXX010101000';
const GENERICOS: ReadonlySet<string> = new Set([RFC_GENERICO_NACIONAL, RFC_GENERICO_EXTRANJERO]);

/** The CFDI 4.0 XSD pattern (tdCFDI:t_RFC), anchored: letters, a valid date, homoclave. */
const RFC_RE = /^[A-Z&Ñ]{3,4}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[A-Z\d]{2}[\dA]$/u;

/** SAT's value table for the check digit, in order: 0–9, A–N, &, O–Z, space, Ñ. */
const VALUES = '0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ';

/** Uppercase, without the spaces and dashes people type. */
export function normalizeRfc(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}

export function tipoPersona(rfc: string): TipoPersona {
  return [...rfc].length === 12 ? 'moral' : 'fisica';
}

/**
 * The check digit of an RFC: mod 11 over the first twelve characters (a
 * persona moral's eleven are padded with a leading space), weights 13 down to 2.
 */
export function rfcCheckDigit(rfc: string): string {
  const chars = [...(tipoPersona(rfc) === 'moral' ? ` ${rfc}` : rfc)].slice(0, 12);
  const sum = chars.reduce((acc, c, i) => acc + VALUES.indexOf(c) * (13 - i), 0);
  const digit = 11 - (sum % 11);
  return digit === 11 ? '0' : digit === 10 ? 'A' : String(digit);
}

/** Shape, date and check digit. Expects a normalised RFC (see `normalizeRfc`). */
export function isValidRfc(rfc: string): boolean {
  if (GENERICOS.has(rfc)) return true;
  return RFC_RE.test(rfc) && rfcCheckDigit(rfc) === [...rfc].at(-1);
}

export const isGenericRfc = (rfc: string): boolean => GENERICOS.has(rfc);

/** A Mexican código postal: exactly five digits. */
export const isValidCodigoPostal = (cp: string): boolean => /^\d{5}$/.test(cp);
