/**
 * Registros por enviar and Avisos, live (O-27/O-16): the Worker's requests and
 * the payloads it hands back. Pure types, shared by the Worker, the screens and
 * the tests; money travels as centavos strings, times as UTC ISO stamps.
 */

/** What else, besides a sale, a gasto or an abono, can wait in the outbox. */
export type ClaseMovimiento =
  | 'deposito'
  | 'retiro'
  | 'apertura'
  | 'cierre'
  | 'respuesta'
  | 'inventario'
  | 'corte'
  | 'entrega'
  | 'conversion'
  | 'conteo'
  | 'producto'
  | 'cliente';

/** One record waiting to be sent, grouped as the operator thinks of it. */
export type PendienteCrudo = (
  | {
      readonly tipo: 'venta';
      readonly id: string;
      readonly en: string;
      readonly folio: number;
      /** The ticket's own "HH:MM" device time; null on old rows. */
      readonly hora: string | null;
      readonly metodo: string;
      readonly lineas: readonly { readonly concepto: string; readonly cantidad: number }[];
      readonly totalCentavos: string;
      readonly cancelada: boolean;
    }
  | {
      readonly tipo: 'gasto';
      readonly id: string;
      readonly en: string;
      readonly concepto: string;
      readonly montoCentavos: string;
      readonly proveedor: string | null;
    }
  | {
      readonly tipo: 'abono';
      readonly id: string;
      readonly en: string;
      readonly cliente: string | null;
      readonly montoCentavos: string;
      readonly metodo: string;
    }
  | {
      readonly tipo: 'movimiento';
      readonly id: string;
      readonly en: string;
      readonly clase: ClaseMovimiento;
      readonly texto: string | null;
      readonly montoCentavos: string | null;
      /** Only for `inventario`: the ledger rows folded into one line. */
      readonly entradas?: number;
      readonly salidas?: number;
    }
) & {
  /** Tried at least once and retrying by itself (DS-06's «M se reintentarán solos»). */
  readonly reintento?: boolean;
};

/** An owner message addressed to this caja's operator (`mensajes_operador`). */
export interface MensajePara {
  readonly id: string;
  readonly severidad: 'info' | 'aclaracion';
  readonly cuerpo: string;
  readonly creado: string;
  /** The corte's day ("YYYY-MM-DD") when the turno is on this device. */
  readonly corte: string | null;
  /** The operator's latest reply, if any (`respuestas_operador`). */
  readonly respuesta: string | null;
}

export interface StockBajoPara {
  readonly id: string;
  readonly nombre: string;
  readonly existencias: number;
  readonly umbral: number;
}

/** Everything Avisos shows, read in one trip. */
export interface AvisosPara {
  readonly mensajes: readonly MensajePara[];
  /** Ids marked read on this device (read marks are device-local, ADR-075). */
  readonly leidos: readonly string[];
  readonly cola: { readonly cuantos: number; readonly desde: string | null };
  /** Rows the server refused for good (not retried by itself). */
  readonly rechazados: number;
  readonly stockBajo: readonly StockBajoPara[];
}

export interface ResponderAvisoCall {
  readonly method: 'responderAviso';
  readonly businessId: string;
  readonly deviceId: string;
  readonly userId: string;
  readonly mensajeId: string;
  readonly texto: string;
}

export type ColaRequest =
  | { readonly id: number; readonly method: 'colaPendiente' }
  | {
      readonly id: number;
      readonly method: 'avisos';
      readonly businessId: string;
      readonly deviceId: string;
      readonly operadorId: string;
    }
  | { readonly id: number; readonly method: 'avisosLeidos'; readonly ids: readonly string[] }
  | (ResponderAvisoCall & { readonly id: number });
