import { nombreMes } from '../../asesor/insights.js';

/** Typed errors of Cierre del mes (E-14, CLAUDE.md §8), each in the founders' words. */
export type CodigoCierre =
  | 'MES_INVALIDO'
  | 'MES_EN_CURSO'
  | 'MES_CERRADO'
  | 'MES_ABIERTO'
  | 'MES_ANTERIOR_ABIERTO'
  | 'MES_POSTERIOR_CERRADO'
  | 'PASOS_PENDIENTES'
  | 'REAPERTURA_PENDIENTE'
  | 'SIN_REAPERTURA'
  | 'MISMO_SOCIO'
  | 'MOTIVO_REAPERTURA'
  | 'SALDO_NO_COINCIDE';

const mes = (periodo: string) => nombreMes(periodo);

const MENSAJES: Record<CodigoCierre, (periodo: string, otro: string) => string> = {
  MES_INVALIDO: () => 'Elige un mes válido.',
  MES_EN_CURSO: (p) => `${cap(mes(p))} se puede cerrar cuando termine.`,
  MES_CERRADO: (p) => `${cap(mes(p))} ya está cerrado.`,
  MES_ABIERTO: (p) => `${cap(mes(p))} está abierto.`,
  MES_ANTERIOR_ABIERTO: (_p, o) => `Cierra primero ${mes(o)}.`,
  MES_POSTERIOR_CERRADO: (_p, o) => `Reabre primero ${mes(o)}.`,
  PASOS_PENDIENTES: (p, o) =>
    o === '1' ? `Falta 1 paso para cerrar ${mes(p)}.` : `Faltan ${o} pasos para cerrar ${mes(p)}.`,
  REAPERTURA_PENDIENTE: (p) => `Ya hay un pedido para reabrir ${mes(p)}.`,
  SIN_REAPERTURA: (p) => `Nadie ha pedido reabrir ${mes(p)}.`,
  MISMO_SOCIO: () => 'Quien pide reabrir no puede aprobarlo: lo aprueba el otro socio.',
  MOTIVO_REAPERTURA: () => 'Escribe qué hay que corregir.',
  SALDO_NO_COINCIDE: () => 'El saldo no coincide con el de la consola.',
};

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export class CierreError extends Error {
  constructor(
    readonly code: CodigoCierre,
    readonly periodo: string,
    otro = '',
  ) {
    super(MENSAJES[code](periodo, otro));
    this.name = 'CierreError';
  }
}
