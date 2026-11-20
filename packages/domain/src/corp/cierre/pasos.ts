import type { Money } from '../../money/index.js';

/**
 * Cierre del mes's seven steps (E-14, board CD-10). Each one is read off what
 * the console already holds; only the bank balance and the contador's
 * statements wait on a founder. A step the month does not need (no sales to
 * the public, no expenses) is «no_aplica» and counts as done. Pure.
 */
export const PASOS_CIERRE = [
  'emitidas',
  'ingresos',
  'recibidas',
  'banco',
  'impuestos',
  'agenda',
  'estados',
] as const;

export type PasoCierre = (typeof PASOS_CIERRE)[number];

export type EstadoPaso = 'hecho' | 'no_aplica' | 'pendiente';

export interface FuentesCierre {
  /** The month's «Público en general» global, if it has one, and payments still to issue. */
  readonly emitidas: {
    readonly global: 'timbrada' | 'por_timbrar' | null;
    readonly porEmitir: number;
  };
  /** Payments collected in the month, and how many have no cobro yet. */
  readonly ingresos: { readonly pagos: number; readonly sinImportar: number };
  /**
   * The month's expenses: how many there are, how many lack their CFDI
   * (a non-deductible one never does), and uploaded XMLs left to review.
   */
  readonly recibidas: {
    readonly gastos: number;
    readonly sinFactura: number;
    readonly porRevisar: number;
  };
  /** Bancos at the month's last day, and what a founder confirmed from the statement. */
  readonly banco: { readonly consola: Money; readonly confirmado: Money | null };
  /**
   * «ISR e IVA» of the month: owed from the SAT registration on, and
   * presented (with its acuse) or paid.
   */
  readonly impuestos: { readonly obligada: boolean; readonly presentada: boolean };
  /** The month's other Agenda obligations, and how many are still open. */
  readonly agenda: { readonly obligaciones: number; readonly pendientes: number };
  /** The contador's statements of the month are in the Expediente. */
  readonly estados: { readonly subidos: boolean };
}

export interface PasoDelCierre {
  readonly id: PasoCierre;
  readonly estado: EstadoPaso;
}

const si = (hecho: boolean): EstadoPaso => (hecho ? 'hecho' : 'pendiente');

function emitidas(f: FuentesCierre['emitidas']): EstadoPaso {
  if (f.global === null && f.porEmitir === 0) return 'no_aplica';
  return si(f.global !== 'por_timbrar' && f.porEmitir === 0);
}

function ingresos(f: FuentesCierre['ingresos']): EstadoPaso {
  return f.pagos === 0 ? 'no_aplica' : si(f.sinImportar === 0);
}

function recibidas(f: FuentesCierre['recibidas']): EstadoPaso {
  if (f.gastos === 0 && f.porRevisar === 0) return 'no_aplica';
  return si(f.sinFactura === 0 && f.porRevisar === 0);
}

/** Confirmed only while it still equals the ledger: a later entry undoes it. */
const banco = (f: FuentesCierre['banco']): EstadoPaso =>
  si(f.confirmado !== null && f.confirmado === f.consola);

function agenda(f: FuentesCierre['agenda']): EstadoPaso {
  return f.obligaciones === 0 ? 'no_aplica' : si(f.pendientes === 0);
}

export function pasosDelCierre(f: FuentesCierre): readonly PasoDelCierre[] {
  const estados: Record<PasoCierre, EstadoPaso> = {
    emitidas: emitidas(f.emitidas),
    ingresos: ingresos(f.ingresos),
    recibidas: recibidas(f.recibidas),
    banco: banco(f.banco),
    impuestos: f.impuestos.obligada ? si(f.impuestos.presentada) : 'no_aplica',
    agenda: agenda(f.agenda),
    estados: si(f.estados.subidos),
  };
  return PASOS_CIERRE.map((id) => ({ id, estado: estados[id] }));
}

export const pasosPendientes = (pasos: readonly PasoDelCierre[]): number =>
  pasos.filter((p) => p.estado === 'pendiente').length;
