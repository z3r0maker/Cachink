import { RFC_GENERICO_EXTRANJERO, RFC_GENERICO_NACIONAL } from '@xangarro/domain';

/**
 * The slices of the SAT CFDI 4.0 catalogs this feature uses (Anexo 20).
 * Sources and the rules behind them: docs/spikes/pac-vendor.md.
 */

/** c_FormaPago used for subscriptions. 99 = "por definir" (PPD only). */
export const FORMA_PAGO = {
  transferencia: '03',
  tarjetaCredito: '04',
  tarjetaDebito: '28',
  porDefinir: '99',
} as const;
export type FormaPago = (typeof FORMA_PAGO)[keyof typeof FORMA_PAGO];

/** c_MetodoPago. */
export type MetodoPago = 'PUE' | 'PPD';

/** c_MotivoCancelacion. */
export type MotivoCancelacion = '01' | '02' | '03' | '04';

// RFC rules, persona types and c_RegimenFiscal live in @xangarro/domain (P-08),
// shared with the portal's Negocio form; re-exported for this module's callers.
export { REGIMEN_FISCAL, USO_CFDI_INGRESO, type TipoPersona } from '@xangarro/domain';

/** The generic receptor of a global CFDI ("público en general"). */
export const PUBLICO_EN_GENERAL = {
  rfc: RFC_GENERICO_NACIONAL,
  nombre: 'PUBLICO EN GENERAL',
  regimenFiscal: '616',
  usoCfdi: 'S01',
} as const;

/** Generic foreign RFC — also not a nominative receptor. */
export const RFC_EXTRANJERO_GENERICO = RFC_GENERICO_EXTRANJERO;

/** Concepto keys the SAT prescribes for each operation inside a global CFDI. */
export const GLOBAL_CONCEPTO = { claveProdServ: '01010101', claveUnidad: 'ACT' } as const;

/**
 * A refund's CFDI de egreso (Guía de llenado, Anexo 20): ClaveProdServ
 * 84111506 «Servicios de facturación», ClaveUnidad ACT, UsoCFDI G02
 * «Devoluciones, descuentos o bonificaciones» for a nominative receptor,
 * TipoRelacion 01 «Nota de crédito de los documentos relacionados».
 * Proposed defaults, part of the contador sign-off (O-14).
 */
export const EGRESO = {
  claveProdServ: '84111506',
  claveUnidad: 'ACT',
  usoCfdi: 'G02',
  tipoRelacion: '01',
} as const;

/** InformacionGlobal Periodicidad 04 = mensual (Meses 01–12). */
export const PERIODICIDAD_MENSUAL = '04' as const;

/** IVA tasa general, as a ratio of integers (16/100). */
export const IVA_RATE = { numerator: 16n, denominator: 100n } as const;
