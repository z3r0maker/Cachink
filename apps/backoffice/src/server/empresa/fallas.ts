import type { LedgerEntry } from '@xangarro/application/corp';

import type { FormState } from '../actions/form-state';
import { NotPermitted } from '../staff';

/**
 * How «Empresa»'s actions answer a failure (ADR-124): the ledger's and the
 * agreement's typed errors already speak Spanish, so their message is shown;
 * anything else is logged and answered generically.
 */
const OWN_MESSAGES: Record<string, string> = {
  MOTIVO_REQUERIDO: 'Escribe por qué lo reviertes.',
};

const DOMAIN_CODES = new Set([
  'CONCEPTO_REQUERIDO',
  'PROYECTO_DESCONOCIDO',
  'PERIODO_CERRADO',
  'MONTO_INVALIDO',
  'TIPO_CAMBIO_INVALIDO',
  'ASIENTO_DESBALANCEADO',
  'MOVIMIENTO_DESCONOCIDO',
  'YA_REVERTIDO',
  'REEMBOLSO_EXCEDE_SALDO',
  'TRIMESTRE_EN_CURSO',
  'TRIMESTRE_INVALIDO',
  'LLAMADA_DESCONOCIDA',
  'VENCIMIENTO_INVALIDO',
]);

export function failed(error: unknown, what: string): FormState {
  if (error instanceof NotPermitted) return { ok: false, message: error.message };
  const code = error instanceof Error && 'code' in error ? String(error.code) : '';
  const own = OWN_MESSAGES[code];
  if (own !== undefined) return { ok: false, message: own };
  if (DOMAIN_CODES.has(code) && error instanceof Error)
    return { ok: false, message: error.message };
  console.error(`[empresa] ${what} failed`, error);
  return { ok: false, message: 'No se pudo guardar. Intenta de nuevo.' };
}

/** The staff audit row of a ledger write. */
export const auditOfEntry = (action: string) => (entry: LedgerEntry) => ({
  action,
  payload: { entryId: entry.id, kind: entry.kind, fecha: entry.fecha, source: entry.source },
});
