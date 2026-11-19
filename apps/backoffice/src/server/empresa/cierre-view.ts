import type { DocumentoMeta, ObligacionVista } from '@xangarro/application/corp';
import type { GastoSinFactura } from '@xangarro/data-corp';
import type { EventoCierre, FuentesCierre } from '@xangarro/domain/corp';

import type { GlobalDelMes } from './emitidas-view';
import { sumarDias } from './fechas';

/**
 * Cierre del mes (E-14, boards CD-10 and CD-10b): what the page reads for a
 * month, and the seven steps' sources derived from it. Pure; the read is
 * `cierre-lectura.ts`, the texts `cierre-pasos.ts` and `cierre-encabezado.ts`.
 */
export interface DetalleCierre {
  readonly emitidas: {
    readonly global: GlobalDelMes | null;
    readonly porEmitir: number;
    readonly pagos: number;
    readonly sinImportar: number;
    /** Centavos. */
    readonly cobradoSinIva: bigint;
  };
  readonly recibidas: {
    readonly gastos: number;
    readonly noDeducibles: number;
    readonly sinFactura: readonly GastoSinFactura[];
    readonly porRevisar: number;
  };
  /** Centavos: Bancos at the month's last day, and the confirmed statement balance. */
  readonly banco: { readonly consola: bigint; readonly confirmado: bigint | null };
  /** The month's «ISR e IVA», if the Agenda computes it. */
  readonly impuestos: ObligacionVista | null;
  /** The month's other Agenda obligations, and the exempt ones named. */
  readonly agenda: {
    readonly otras: readonly ObligacionVista[];
    readonly exentas: readonly string[];
  };
  /** The contador's statements of the month, the newest version. */
  readonly estados: DocumentoMeta | null;
}

export interface DatosCierre {
  readonly mes: string;
  /** `YYYY-MM-DD` in Mexico. */
  readonly hoy: string;
  readonly detalle: DetalleCierre;
  readonly eventos: ReadonlyMap<string, readonly EventoCierre[]>;
  readonly cerrados: ReadonlySet<string>;
  readonly conMovimientos: ReadonlySet<string>;
  /** `corp.founders.id` → name. */
  readonly socios: ReadonlyMap<string, string>;
}

export function fuentesDe(d: DetalleCierre): FuentesCierre {
  const presentada =
    d.impuestos !== null &&
    (d.impuestos.estado === 'presentada' || d.impuestos.estado === 'pagada');
  return {
    emitidas: {
      global:
        d.emitidas.global === null ? null : d.emitidas.global.timbrada ? 'timbrada' : 'por_timbrar',
      porEmitir: d.emitidas.porEmitir,
    },
    ingresos: { pagos: d.emitidas.pagos, sinImportar: d.emitidas.sinImportar },
    recibidas: {
      gastos: d.recibidas.gastos,
      sinFactura: d.recibidas.sinFactura.length,
      porRevisar: d.recibidas.porRevisar,
    },
    banco: d.banco,
    impuestos: { obligada: d.impuestos !== null, presentada },
    agenda: {
      obligaciones: d.agenda.otras.length,
      pendientes: d.agenda.otras.filter((o) => !o.cumplida).length,
    },
    estados: { subidos: d.estados !== null },
  };
}

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

/** The month in `?mes=`, else the last one: the month there is to close. */
export function parseMesCierre(raw: string | undefined, hoy: string): string {
  if (raw !== undefined && MES.test(raw)) return raw;
  return sumarDias(`${hoy.slice(0, 7)}-01`, -1).slice(0, 7);
}

export type PanelCierre = 'banco' | 'reabrir' | 'aprobar';

export function hrefCierre(mes: string, panel?: PanelCierre): string {
  return `/empresa/cierre?mes=${mes}${panel === undefined ? '' : `&panel=${panel}`}`;
}

export function parsePanel(raw: string | undefined): PanelCierre | null {
  return raw === 'banco' || raw === 'reabrir' || raw === 'aprobar' ? raw : null;
}
