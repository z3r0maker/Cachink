import { parseAtributos, parseMetodosPago, regimenPatch } from '@xangarro/domain';

import type { NegocioData } from '@/server/screens';
import type { GuardarNegocioForm } from '@/server/actions/guardar-negocio';

/**
 * What the edit mode holds while the owner types. Options are edited as one
 * comma-separated string; the ISR rate follows the régimen only when the owner
 * leaves «usar la tasa sugerida» on.
 */
export interface AtributoRow {
  readonly label: string;
  readonly opciones: string;
  readonly obligatorio: boolean;
}

export interface Draft {
  readonly nombre: string;
  readonly regimenSat: string | null;
  readonly usarSugerida: boolean;
  readonly rfc: string;
  readonly razonSocial: string;
  readonly codigoPostal: string;
  readonly usoCfdi: string;
  readonly metodosPago: readonly string[];
  readonly atributos: readonly AtributoRow[];
}

export type Business = NonNullable<NegocioData>;

export function draftOf(b: Business): Draft {
  return {
    nombre: b.nombre,
    regimenSat: b.regimenSat,
    usarSugerida: true,
    rfc: b.rfc ?? '',
    razonSocial: b.razonSocial ?? '',
    codigoPostal: b.codigoPostal ?? '',
    usoCfdi: b.usoCfdi ?? 'G03',
    metodosPago: parseMetodosPago(b.enabledPaymentMethods),
    atributos: parseAtributos(b.atributosProducto).map((a) => ({
      label: a.label,
      opciones: (a.opciones ?? []).join(', '),
      obligatorio: a.obligatorio,
    })),
  };
}

/** The ISR rate the régimen suggests, when the owner changed the régimen. */
export function sugerida(b: Business, d: Draft): number | null {
  if (d.regimenSat === null || d.regimenSat === b.regimenSat) return null;
  const s = regimenPatch(d.regimenSat).isrSugerido;
  return s === b.isrTasa ? null : s;
}

export function formOf(b: Business, d: Draft): GuardarNegocioForm {
  const s = sugerida(b, d);
  return {
    nombre: d.nombre,
    regimenSat: d.regimenSat,
    isrTasa: s !== null && d.usarSugerida ? s : b.isrTasa,
    rfc: d.rfc,
    razonSocial: d.razonSocial,
    codigoPostal: d.codigoPostal,
    usoCfdi: d.usoCfdi,
    metodosPago: d.metodosPago,
    atributos: d.atributos.map((a) => ({
      label: a.label,
      opciones: a.opciones.split(','),
      obligatorio: a.obligatorio,
    })),
  };
}
