import { ERROR_CATALOG, type ErrorCode } from '@xangarro/contracts';

/**
 * Why a phone's row was refused, as a sentence for the owner — never a code
 * (P-11). Keyed by the contract's `userMessageKey`, so the catalogue stays the
 * one list of codes; `tests/sync-motivos.test.ts` fails if a per-row code is
 * added there without a sentence here.
 */
const MENSAJES: Readonly<Record<string, string>> = {
  'sync.errors.validation': 'El registro tiene datos que el servidor no acepta.',
  'sync.errors.businessMismatch': 'El registro pertenece a otro negocio.',
  'sync.errors.tableNotWritable': 'Este tipo de registro no se envía desde el teléfono.',
  'sync.errors.hybridUpdate': 'Este tipo de registro solo se cambia en el portal.',
  'sync.errors.fkProduct': 'El producto de este registro ya no existe en el portal.',
  'sync.errors.fkUser': 'El operador de este registro ya no existe en el portal.',
  'sync.errors.fkClient': 'El cliente de este registro ya no existe en el portal.',
  'sync.errors.duplicate': 'Ya existe un registro igual; el teléfono lo mandó dos veces.',
};

const FALLBACK = 'El registro tiene datos que el servidor no acepta.';

export function motivoDeRechazo(code: string): string {
  const entry = ERROR_CATALOG[code as ErrorCode] as { userMessageKey: string } | undefined;
  return (entry && MENSAJES[entry.userMessageKey]) ?? FALLBACK;
}

/** Exposed for the coverage test. */
export const MENSAJES_DE_RECHAZO = MENSAJES;
