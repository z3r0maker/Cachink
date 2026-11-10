import { newUlid, totalContado, type ConteoDenominaciones } from '@xangarro/domain';

import type { Phone } from './sync-phone';

/**
 * Wire rows a phone pushes beyond `sync-phone.ts`'s tickets and lines: a
 * caja turno, a gasto, an operator's reply. Each returns the delta exactly as
 * the outbox sends it; amounts are centavos (`bigint`, CLAUDE.md §2.8).
 */
const audit = (phone: Phone, by: string | null, at: string, updatedAt = at) => ({
  businessId: phone.businessId,
  deviceId: phone.deviceId,
  createdByUserId: by,
  createdAt: at,
  updatedAt,
  deletedAt: null,
});

export interface Cierre {
  readonly at: string;
  /** Centavos the calculator expected in the drawer. */
  readonly esperado: bigint;
  /** What was counted, piece by piece: the portal derives «Contado» from it. */
  readonly conteo: ConteoDenominaciones;
  readonly motivo?: string;
  readonly nota?: string;
}

export interface TurnoRow {
  readonly id: string;
  readonly userId: string;
  readonly fecha: string;
  readonly aperturaAt: string;
  /** Centavos. */
  readonly fondo: bigint;
}

/** What an open turno leaves empty. */
const ABIERTO = {
  cierreAt: null,
  montoCierreCentavos: null,
  efectivoEsperadoCentavos: null,
  diferenciaCentavos: null,
  discrepancyReason: null,
  explicacion: null,
  conteoCentavos: null,
  conteoAt: null,
  denominaciones: null,
};

/** What the close writes: the count, the difference, and the operator's reason. */
function cerrado(c: Cierre) {
  const contado = totalContado(c.conteo);
  return {
    cierreAt: c.at,
    montoCierreCentavos: contado,
    efectivoEsperadoCentavos: c.esperado,
    diferenciaCentavos: contado - c.esperado,
    discrepancyReason: c.motivo ?? null,
    explicacion: c.nota ?? null,
    conteoCentavos: contado,
    conteoAt: c.at,
    denominaciones: c.conteo,
  };
}

/** A turno as `AbrirCajaUseCase` writes it, or — with `cierre` — as the close rewrites it. */
export function turno(phone: Phone, t: TurnoRow, cierre?: Cierre) {
  const row = {
    id: t.id,
    userId: t.userId,
    fecha: t.fecha,
    aperturaAt: t.aperturaAt,
    montoAperturaCentavos: t.fondo,
    efectivoAdicionalCentavos: 0n,
    totalTransferencias: 0n,
    totalTarjeta: 0n,
    totalQr: 0n,
    totalCredito: 0n,
    egresoAutoId: null,
    ...(cierre === undefined ? ABIERTO : cerrado(cierre)),
    ...audit(phone, t.userId, t.aperturaAt, cierre === undefined ? t.aperturaAt : cierre.at),
  };
  const op = cierre === undefined ? 'insert' : 'update';
  return { table: 'caja_turnos', rowId: t.id, op, clientSeq: 1, row };
}

/** The operator's answer to an owner's message (ADR-075), from the Avisos reply box. */
export function respuesta(phone: Phone, mensajeId: string, texto: string, by: string, at: string) {
  const id = newUlid();
  const row = { id, mensajeId, texto, ...audit(phone, by, at) };
  return { table: 'respuestas_operador', rowId: id, op: 'insert', clientSeq: 1, row };
}

export interface GastoRow {
  readonly fecha: string;
  readonly concepto: string;
  readonly categoria: string;
  /** Centavos. */
  readonly monto: bigint;
  readonly gastoRecurrenteId?: string | null;
  readonly cajaTurnoId?: string | null;
  readonly at: string;
}

/** An egreso as `RegistrarEgreso` / `ProcesarGastoRecurrente` write it. */
export function gasto(phone: Phone, g: GastoRow) {
  const id = newUlid();
  const row = {
    id,
    fecha: g.fecha,
    concepto: g.concepto,
    categoria: g.categoria,
    monto: g.monto,
    proveedor: null,
    empleadoId: null,
    gastoRecurrenteId: g.gastoRecurrenteId ?? null,
    cajaTurnoId: g.cajaTurnoId ?? null,
    ...audit(phone, null, g.at),
  };
  return { table: 'expenses', rowId: id, op: 'insert', clientSeq: 1, row };
}
