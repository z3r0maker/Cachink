/**
 * Receptor validation. A tenant whose fiscal data is incomplete or invalid is
 * not an error: the payment joins the monthly "público en general" global
 * CFDI instead, and the reasons are recorded so the portal can prompt for a fix.
 */

import {
  isGenericRfc,
  isValidCodigoPostal,
  isValidRfc,
  normalizeRfc,
  REGIMEN_FISCAL,
  tipoPersona,
  type TipoPersona,
} from '@xangarro/domain';

import { USO_CFDI_INGRESO } from './sat-catalogs.js';
import type { CfdiReceptor, TenantFiscalData } from './types.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NOMBRE = 254;
/** Uso CFDI when the tenant hasn't chosen one: G03, gastos en general. */
export const USO_CFDI_DEFAULT = 'G03';

export type FiscalIssue =
  | 'rfc_missing'
  | 'rfc_invalid'
  | 'rfc_generic'
  | 'razon_social_missing'
  | 'razon_social_invalid'
  | 'regimen_missing'
  | 'regimen_invalid'
  | 'regimen_rfc_mismatch'
  | 'uso_cfdi_invalid'
  | 'uso_cfdi_regimen_mismatch'
  | 'codigo_postal_missing'
  | 'codigo_postal_invalid';

export type FiscalValidation =
  | { readonly ok: true; readonly receptor: CfdiReceptor }
  | { readonly ok: false; readonly reasons: readonly FiscalIssue[] };

/** RFC format and SAT check digit — the domain's rule, shared with the portal (P-08). */
export { isValidRfc };

function clean(value: string | null | undefined): string {
  return (value ?? '').trim();
}

function rfcIssue(rfc: string): FiscalIssue | null {
  if (!rfc) return 'rfc_missing';
  if (isGenericRfc(rfc)) return 'rfc_generic';
  return isValidRfc(rfc) ? null : 'rfc_invalid';
}

function regimenIssue(regimen: string, persona: TipoPersona | null): FiscalIssue | null {
  if (!regimen) return 'regimen_missing';
  const allowed = REGIMEN_FISCAL[regimen];
  if (!allowed) return 'regimen_invalid';
  return persona && !allowed.includes(persona) ? 'regimen_rfc_mismatch' : null;
}

function usoIssue(uso: string, persona: TipoPersona | null): FiscalIssue | null {
  if (!(USO_CFDI_INGRESO as readonly string[]).includes(uso)) return 'uso_cfdi_invalid';
  return uso.startsWith('D') && persona === 'moral' ? 'uso_cfdi_regimen_mismatch' : null;
}

function nombreIssue(nombre: string): FiscalIssue | null {
  if (!nombre) return 'razon_social_missing';
  return nombre.length > MAX_NOMBRE ? 'razon_social_invalid' : null;
}

function cpIssue(cp: string): FiscalIssue | null {
  if (!cp) return 'codigo_postal_missing';
  return isValidCodigoPostal(cp) ? null : 'codigo_postal_invalid';
}

/** Validate and normalise (trim, upper-case RFC) a tenant's fiscal data. */
export function validateTenantFiscal(data: TenantFiscalData): FiscalValidation {
  const rfc = normalizeRfc(clean(data.rfc));
  const nombre = clean(data.razonSocial);
  const regimenFiscal = clean(data.regimenFiscal);
  const usoCfdi = clean(data.usoCfdi).toUpperCase() || USO_CFDI_DEFAULT;
  const codigoPostal = clean(data.codigoPostal);
  const rfcProblem = rfcIssue(rfc);
  const persona = rfcProblem ? null : tipoPersona(rfc);
  const reasons = [
    rfcProblem,
    nombreIssue(nombre),
    regimenIssue(regimenFiscal, persona),
    usoIssue(usoCfdi, persona),
    cpIssue(codigoPostal),
  ].filter((issue): issue is FiscalIssue => issue !== null);
  if (reasons.length > 0) return { ok: false, reasons };
  const email = clean(data.email);
  const receptor: CfdiReceptor = { rfc, nombre, regimenFiscal, usoCfdi, codigoPostal };
  return { ok: true, receptor: EMAIL_RE.test(email) ? { ...receptor, email } : receptor };
}
