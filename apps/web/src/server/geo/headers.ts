/**
 * The approximate origin of a request, as Vercel already derived it (N-55).
 *
 * This module is the whole of the feature's contact with location data, and it
 * reads exactly two headers. It never reads `x-forwarded-for` and never calls
 * `clientIp` — the raw IP stays out of this path entirely, which is the claim
 * the *aviso de privacidad* rests on and what `tests/geo-headers.test.ts`
 * enforces with a fake that throws on any other header.
 *
 * Measured on a Hobby deployment on 2026-09-22: `x-vercel-ip-country` is `MX`
 * and `x-vercel-ip-country-region` is the **bare** subdivision (`CHH`), not
 * the prefixed `MX-CHH` the ISO 3166-2 code is usually written as. We store it
 * bare and prefix at read time.
 */

/** Country stored when the request carried no usable geo header. */
export const GEO_UNKNOWN_COUNTRY = 'ZZ';

export interface RequestRegion {
  /** ISO 3166-1 alpha-2, uppercase; `ZZ` when unknown. */
  readonly country: string;
  /** Bare ISO 3166-2 subdivision, uppercase; `''` when unknown. */
  readonly region: string;
}

const COUNTRY = /^[A-Z]{2}$/;
const REGION = /^[A-Z0-9]{1,3}$/;

function clean(value: string | null): string {
  return (value ?? '').trim().toUpperCase();
}

/**
 * A region may arrive prefixed (`MX-CHH`) if Vercel ever changes format;
 * keeping only the subdivision half stops the same place being stored under
 * two spellings.
 */
function subdivision(raw: string, country: string): string {
  const bare = raw.startsWith(`${country}-`) ? raw.slice(country.length + 1) : raw;
  return REGION.test(bare) ? bare : '';
}

export function regionFromHeaders(headers: Pick<Headers, 'get'>): RequestRegion {
  const country = clean(headers.get('x-vercel-ip-country'));
  if (!COUNTRY.test(country)) return { country: GEO_UNKNOWN_COUNTRY, region: '' };
  return { country, region: subdivision(clean(headers.get('x-vercel-ip-country-region')), country) };
}
