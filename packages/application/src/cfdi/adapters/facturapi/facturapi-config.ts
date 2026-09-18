/**
 * Facturapi credentials from environment variables (server-side only).
 *
 *   FACTURAPI_API_KEY   required  organization secret key: sk_test_… (sandbox,
 *                                 never reaches the SAT) or sk_live_…
 *   FACTURAPI_BASE_URL  optional  default https://www.facturapi.io/v2
 *
 * The CSD is uploaded once to the Facturapi organization, not configured here.
 */

import { configError, envValue, type EnvSource } from '../../issuer-config.js';

export const FACTURAPI_DEFAULT_BASE_URL = 'https://www.facturapi.io/v2';

export interface FacturapiConfig {
  readonly apiKey: string;
  readonly baseUrl: string;
  /** True for an `sk_live_` key — real CFDIs. */
  readonly livemode: boolean;
}

export function readFacturapiConfig(env: EnvSource): FacturapiConfig {
  const apiKey = envValue(env, 'FACTURAPI_API_KEY') ?? '';
  const match = /^sk_(test|live)_\S+$/.exec(apiKey);
  if (!match)
    throw configError('FACTURAPI_API_KEY falta o no es una llave secreta sk_test_/sk_live_');
  const baseUrl = (envValue(env, 'FACTURAPI_BASE_URL') ?? FACTURAPI_DEFAULT_BASE_URL).replace(
    /\/+$/,
    '',
  );
  if (!baseUrl.startsWith('https://')) throw configError('FACTURAPI_BASE_URL debe usar https');
  return { apiKey, baseUrl, livemode: match[1] === 'live' };
}
