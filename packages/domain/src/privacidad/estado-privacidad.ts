/**
 * What «Privacidad y mis datos» reads from the consent ledger and writes back
 * (ADR-137). The ledger is append-only, so the state is its latest row per
 * purpose; changing a choice is a new row, never an edit.
 */
import { type AvisoVigente, type ConsentGrant, type ConsentPurpose } from './consentimiento.js';

/** One ledger row, as much of it as the page needs. */
export interface ConsentimientoGuardado {
  readonly purpose: ConsentPurpose;
  readonly granted: boolean;
  readonly avisoVersion: string;
  /** ISO-8601. */
  readonly createdAt: string;
}

export interface EstadoPrivacidad {
  /** The aviso the person accepted last, and when; `null` before any acceptance. */
  readonly aceptado: { readonly version: string; readonly at: string } | null;
  /** Their latest novedades choice; no row means no novedades. */
  readonly novedades: boolean;
  /** The current aviso is not the one accepted: «Actualizamos el aviso». */
  readonly avisoNuevo: boolean;
}

function ultima(
  rows: readonly ConsentimientoGuardado[],
  purpose: ConsentPurpose,
): ConsentimientoGuardado | undefined {
  return rows
    .filter((r) => r.purpose === purpose)
    .reduce<
      ConsentimientoGuardado | undefined
    >((a, r) => (a === undefined || r.createdAt > a.createdAt ? r : a), undefined);
}

export function estadoDePrivacidad(
  rows: readonly ConsentimientoGuardado[],
  vigente: string,
): EstadoPrivacidad {
  const nec = ultima(rows, 'necesarias');
  const aceptado = nec?.granted === true ? { version: nec.avisoVersion, at: nec.createdAt } : null;
  return {
    aceptado,
    novedades: ultima(rows, 'novedades')?.granted === true,
    avisoNuevo: aceptado === null || aceptado.version !== vigente,
  };
}

/** The novedades switch: one explicit row, on the aviso the person accepted. */
export function consentimientoDeNovedades(aviso: AvisoVigente, on: boolean): ConsentGrant {
  return {
    avisoVersion: aviso.version,
    avisoSha256: aviso.sha256,
    surface: 'configuracion',
    purpose: 'novedades',
    granted: on,
    method: 'boton',
  };
}

/**
 * «Acepto el aviso nuevo»: the express act for necesarias (art. 7), and the
 * person's novedades choice carried over to the new version as it was.
 */
export function reconsentimiento(aviso: AvisoVigente, novedades: boolean): readonly ConsentGrant[] {
  const base = {
    avisoVersion: aviso.version,
    avisoSha256: aviso.sha256,
    surface: 'reconsentimiento',
  } as const;
  return [
    { ...base, purpose: 'necesarias', granted: true, method: 'boton' },
    { ...base, purpose: 'novedades', granted: novedades, method: novedades ? 'tacito' : 'casilla' },
  ];
}
