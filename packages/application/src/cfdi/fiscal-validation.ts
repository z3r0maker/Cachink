/**
 * Receptor validation. A tenant whose fiscal data is incomplete or invalid is
 * not an error: the payment joins the monthly "público en general" global
 * CFDI instead, and the reasons are recorded so the portal can prompt for a fix.
 */

import {
  REGIMEN_FISCAL,
  RFC_EXTRANJERO_GENERICO,
  PUBLICO_EN_GENERAL,
  USO_CFDI_INGRESO,
  type TipoPersona,
} from './sat-catalogs.js';
import type { CfdiReceptor, TenantFiscalData } from './types.js';

/** The pattern of the RFC in the CFDI 4.0 XSD (tdCFDI:t_RFC), anchored. */
const RFC_RE = /^[A-Z&Ñ]{3,4}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[A-Z\d]{2}[\dA]$/u;
const CP_RE = /^\d{5}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NOMBRE = 254;

export type FiscalIssue =
  | 'rfc_missing'
  | 'rfc_invalid'
  | 'rfc_generic'
  | 'razon_social_missing'
  | 'razon_social_invalid'
  | 'regimen_missing'
  | 'regimen_invalid'
  | 'regimen_rfc_mismatch'
  | 'uso_cfdi_missing'
  | 'uso_cfdi_invalid'
  | 'uso_cfdi_regimen_mismatch'
  | 'codigo_postal_missing'
  | 'codigo_postal_invalid';

export type FiscalValidation =
  | { readonly ok: true; readonly receptor: CfdiReceptor }
  | { readonly ok: false; readonly reasons: readonly FiscalIssue[] };

export function isValidRfc(rfc: string): boolean {
  return RFC_RE.test(rfc);
}

function clean(value: string | null | undefined): string {
  return (value ?? '').trim();
}

function rfcIssue(rfc: string): FiscalIssue | null {
  if (!rfc) return 'rfc_missing';
  if (rfc === PUBLICO_EN_GENERAL.rfc || rfc === RFC_EXTRANJERO_GENERICO) return 'rfc_generic';
  return isValidRfc(rfc) ? null : 'rfc_invalid';
}

function tipoPersona(rfc: string): TipoPersona {
  return [...rfc].length === 12 ? 'moral' : 'fisica';
}

function regimenIssue(regimen: string, persona: TipoPersona | null): FiscalIssue | null {
  if (!regimen) return 'regimen_missing';
  const allowed = REGIMEN_FISCAL[regimen];
  if (!allowed) return 'regimen_invalid';
  return persona && !allowed.includes(persona) ? 'regimen_rfc_mismatch' : null;
}

function usoIssue(uso: string, persona: TipoPersona | null): FiscalIssue | null {
  if (!uso) return 'uso_cfdi_missing';
  if (!(USO_CFDI_INGRESO as readonly string[]).includes(uso)) return 'uso_cfdi_invalid';
  return uso.startsWith('D') && persona === 'moral' ? 'uso_cfdi_regimen_mismatch' : null;
}

function nombreIssue(nombre: string): FiscalIssue | null {
  if (!nombre) return 'razon_social_missing';
  return nombre.length > MAX_NOMBRE ? 'razon_social_invalid' : null;
}

function cpIssue(cp: string): FiscalIssue | null {
  if (!cp) return 'codigo_postal_missing';
  return CP_RE.test(cp) ? null : 'codigo_postal_invalid';
}

/** Validate and normalise (trim, upper-case RFC) a tenant's fiscal data. */
export function validateTenantFiscal(data: TenantFiscalData): FiscalValidation {
  const rfc = clean(data.rfc).toUpperCase();
  const nombre = clean(data.razonSocial);
  const regimenFiscal = clean(data.regimenFiscal);
  const usoCfdi = clean(data.usoCfdi).toUpperCase();
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
