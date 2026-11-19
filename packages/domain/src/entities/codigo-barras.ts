/**
 * A barcode names one product (ADR-150). Every comparison of two codes goes
 * through `codigoCanonico`, on the phone and in Postgres, so a UPC-A read as
 * 12 digits on Android and as a 13-digit EAN on iOS find the same product.
 * The product keeps the code exactly as it was saved; only the key is shared.
 */

/** GTIN-8, GTIN-12 (UPC-A), GTIN-13 (EAN-13) and GTIN-14: digits only. */
const GTIN = /^(?:\d{8}|\d{12,14})$/;

/** The GS1 form every GTIN pads to. */
const GTIN_14 = 14;

/**
 * The key two codes are compared by: a GTIN left-padded with zeros to 14
 * digits, any other code trimmed and upper-cased, and `null` for no code.
 * The check digit is not checked: a code is compared as the reader gave it.
 */
export function codigoCanonico(raw: string | null | undefined): string | null {
  const codigo = (raw ?? '').trim();
  if (codigo === '') return null;
  return GTIN.test(codigo) ? codigo.padStart(GTIN_14, '0') : codigo.toUpperCase();
}

/** Two codes name the same product; no code never matches anything. */
export function mismoCodigo(a: string | null | undefined, b: string | null | undefined): boolean {
  const ka = codigoCanonico(a);
  return ka !== null && ka === codigoCanonico(b);
}
