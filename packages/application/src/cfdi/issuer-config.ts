/**
 * Issuer settings from environment variables. The CSD (certificado de sello
 * digital) is never here: it is uploaded once to the PAC's vault.
 *
 *   CFDI_LUGAR_EXPEDICION  required  issuer's 5-digit CP (LugarExpedicion)
 *   CFDI_PRODUCT_KEY       optional  ClaveProdServ, default 81112106
 *   CFDI_UNIT_KEY          optional  ClaveUnidad, default E48
 */

import { CfdiError } from './errors.js';
import type { CfdiIssuerConfig } from './types.js';

export type EnvSource = Readonly<Record<string, string | undefined>>;

export const DEFAULT_SUBSCRIPTION_KEYS = { productKey: '81112106', unitKey: 'E48' } as const;

export function configError(message: string): CfdiError {
  return new CfdiError('CFDI_PROVIDER_CONFIG', message);
}

/** Trimmed env value; empty counts as unset. */
export function envValue(env: EnvSource, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

export function readCfdiIssuerConfig(env: EnvSource): CfdiIssuerConfig {
  const lugarExpedicion = envValue(env, 'CFDI_LUGAR_EXPEDICION') ?? '';
  if (!/^\d{5}$/.test(lugarExpedicion)) {
    throw configError('CFDI_LUGAR_EXPEDICION debe ser un código postal de 5 dígitos');
  }
  const productKey = envValue(env, 'CFDI_PRODUCT_KEY') ?? DEFAULT_SUBSCRIPTION_KEYS.productKey;
  if (!/^\d{8}$/.test(productKey)) throw configError('CFDI_PRODUCT_KEY debe tener 8 dígitos');
  const unitKey = envValue(env, 'CFDI_UNIT_KEY') ?? DEFAULT_SUBSCRIPTION_KEYS.unitKey;
  if (!/^[A-Z\d]{2,3}$/.test(unitKey)) throw configError('CFDI_UNIT_KEY inválida');
  return { lugarExpedicion, productKey, unitKey };
}
