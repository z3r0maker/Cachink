import type { LedgerEntry, RecurrenteRegistrado } from '@xangarro/application/corp';

import type { FormState } from '../actions/form-state';
import { NotPermitted } from '../staff';
import { reportError } from '../observability/report';
import { mesCerrado } from './cierre-falla';

/**
 * How «Empresa»'s actions answer a failure (ADR-125): the ledger's and the
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
  'FECHA_INVALIDA',
  'EVIDENCIA_FALTANTE',
  'TRANSICION_INVALIDA',
  'OBLIGACION_DESCONOCIDA',
  'OBLIGACION_EXENTA',
  'ARCHIVO_INVALIDO',
  'INSCRIPCION_FUTURA',
  'DOCUMENTO_INVALIDO',
  'DOCUMENTO_DESCONOCIDO',
  'YA_REEMPLAZADO',
  'EVENTO_ACCIONES_INVALIDO',
  'ACCIONES_INSUFICIENTES',
  'CERTIFICADO_INVALIDO',
  'REGISTRO_INVALIDO',
  'PLANTILLA_INVALIDA',
  'PLANTILLA_DESCONOCIDA',
  'RECURRENTE_YA_REGISTRADO',
  'CFDI_INVALIDO',
  'RFC_MEXIA_PENDIENTE',
  'SIN_ARCHIVOS',
  'FACTURA_DESCONOCIDA',
  'FACTURA_NO_PENDIENTE',
  'FACTURA_NO_POR_PAGAR',
  'FECHA_PAGO_ANTERIOR',
  'FACTURA_NO_POR_VERIFICAR',
  'FACTURA_SIN_REGISTRAR',
  'FECHA_PAGO_FUTURA',
  'FECHA_PAGO_INVALIDA',
  'TOPE_INVALIDO',
  'SERVICIO_INVALIDO',
  'SERVICIO_DESCONOCIDO',
  'DECLARACION_INVALIDA',
  'DECLARACION_FALTANTE',
  'DECLARACION_PAGADA',
  'IMPUESTOS_INVALIDOS',
  'SE_PAGA_DESDE_IMPUESTOS',
  'MES_INVALIDO',
  'MES_EN_CURSO',
  'MES_CERRADO',
  'MES_ABIERTO',
  'MES_ANTERIOR_ABIERTO',
  'MES_POSTERIOR_CERRADO',
  'PASOS_PENDIENTES',
  'REAPERTURA_PENDIENTE',
  'SIN_REAPERTURA',
  'MISMO_SOCIO',
  'MOTIVO_REAPERTURA',
  'SALDO_NO_COINCIDE',
  'PRESUPUESTO_TRIMESTRE',
  'PRESUPUESTO_PASADO',
  'PRESUPUESTO_PENDIENTE',
  'PRESUPUESTO_APROBADO',
  'PRESUPUESTO_MONTOS',
  'PRESUPUESTO_DESCONOCIDO',
  'PRESUPUESTO_RESPONDIDO',
  'PRESUPUESTO_MISMO_SOCIO',
  'SOLICITUD_CONCEPTO',
  'SOLICITUD_MONTO',
  'SOLICITUD_CATEGORIA',
  'SOLICITUD_DESCONOCIDA',
  'SOLICITUD_RESPONDIDA',
  'SOLICITUD_MISMO_SOCIO',
  'SOLICITUD_OTRO_MONTO',
  'CODIGO_FORMATO',
  'CODIGO_CUENTA',
  'CODIGOS_SIN_LISTA',
  'CODIGOS_DESACTUALIZADA',
  'CODIGOS_INCOMPLETOS',
  'CODIGOS_YA_VALIDADOS',
  'CODIGOS_FECHA',
  'CODIGOS_FECHA_FUTURA',
]);

export function failed(error: unknown, what: string): FormState {
  if (error instanceof NotPermitted) return { ok: false, message: error.message };
  const code = error instanceof Error && 'code' in error ? String(error.code) : '';
  const cerrado = mesCerrado(error);
  if (cerrado !== null) return cerrado;
  const own = OWN_MESSAGES[code];
  if (own !== undefined) return { ok: false, message: own };
  if (DOMAIN_CODES.has(code) && error instanceof Error)
    return { ok: false, message: error.message };
  reportError(error, `[empresa] ${what} failed`);
  return { ok: false, message: 'No se pudo guardar. Intenta de nuevo.' };
}

/** The staff audit row of a ledger write. */
export const auditOfEntry = (action: string) => (entry: LedgerEntry) => ({
  action,
  payload: { entryId: entry.id, kind: entry.kind, fecha: entry.fecha, source: entry.source },
});

/** A recurring charge is a ledger write too; the row also names its template (E-02). */
export const auditOfRecurrente = (r: RecurrenteRegistrado) => {
  const row = auditOfEntry('empresa.movimiento_registrado')(r.entry);
  return { ...row, payload: { ...row.payload, plantillaId: r.plantilla.id } };
};
