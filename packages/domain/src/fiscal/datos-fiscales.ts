import { USO_CFDI_INGRESO } from './regimen.js';
import { isGenericRfc, isValidCodigoPostal, isValidRfc, normalizeRfc, tipoPersona } from './rfc.js';

/**
 * The business's fiscal data as the owner types it in Negocio (P-08).
 *
 * Every field may be left blank — it is collected when the owner has it, and
 * a business sells without it — but whatever is filled in must be valid. A
 * uso that does not fit the persona type is a **warning**, not an error:
 * whether to enforce that is still a question for a contador (N-33).
 */
export interface DatosFiscalesInput {
  readonly rfc: string;
  readonly razonSocial: string;
  readonly codigoPostal: string;
  readonly usoCfdi: string;
}

export interface DatosFiscales {
  readonly rfc: string | null;
  readonly razonSocial: string | null;
  readonly codigoPostal: string | null;
  readonly usoCfdi: string | null;
}

export type DatosFiscalesResult =
  | { readonly ok: true; readonly value: DatosFiscales; readonly warnings: readonly string[] }
  | { readonly ok: false; readonly errors: Partial<Record<keyof DatosFiscales, string>> };

const orNull = (v: string): string | null => (v === '' ? null : v);

function errorsOf(v: DatosFiscales): Partial<Record<keyof DatosFiscales, string>> {
  const errors: Partial<Record<keyof DatosFiscales, string>> = {};
  if (v.rfc !== null && (!isValidRfc(v.rfc) || isGenericRfc(v.rfc))) {
    errors.rfc = 'Revisa el RFC: no es válido.';
  }
  if (v.razonSocial !== null && v.razonSocial.length > 254) {
    errors.razonSocial = 'La razón social es demasiado larga.';
  }
  if (v.codigoPostal !== null && !isValidCodigoPostal(v.codigoPostal)) {
    errors.codigoPostal = 'El código postal tiene 5 números.';
  }
  if (v.usoCfdi !== null && !(USO_CFDI_INGRESO as readonly string[]).includes(v.usoCfdi)) {
    errors.usoCfdi = 'Ese uso de CFDI no existe.';
  }
  return errors;
}

export function validateDatosFiscales(input: DatosFiscalesInput): DatosFiscalesResult {
  const value: DatosFiscales = {
    rfc: orNull(normalizeRfc(input.rfc)),
    razonSocial: orNull(input.razonSocial.trim()),
    codigoPostal: orNull(input.codigoPostal.trim()),
    usoCfdi: orNull(input.usoCfdi.trim().toUpperCase()),
  };
  const errors = errorsOf(value);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const warnings =
    value.rfc !== null && tipoPersona(value.rfc) === 'moral' && value.usoCfdi?.startsWith('D')
      ? ['Los usos D (deducciones personales) son para personas físicas.']
      : [];
  return { ok: true, value, warnings };
}
