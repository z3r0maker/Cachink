import { anteriorDiaHabil, siguienteDiaHabil, sumarDiasHabiles } from './dias-habiles.js';
import { FechaInvalidaError } from './errors.js';

/**
 * MEXIA's obligations (E-04): a template says who asks, on what basis, how
 * its due date is computed and what proves each step; an instance is one
 * period of it. Recurring instances are computed, never seeded: a row exists
 * only once a founder moves it or attaches a document.
 */
export type Autoridad = 'SAT' | 'Economía' | 'IMPI';
export type Paso = 'preparada' | 'presentada' | 'pagada';
export type Estado = 'pendiente' | Paso;
export const TIPOS_EVIDENCIA = [
  'acuse',
  'linea_captura',
  'comprobante_pago',
  'opinion_32d',
  'captura',
  'otro',
] as const;
export type TipoEvidencia = (typeof TIPOS_EVIDENCIA)[number];

export function isTipoEvidencia(value: string): value is TipoEvidencia {
  return (TIPOS_EVIDENCIA as readonly string[]).includes(value);
}

export type Regla =
  /** Day `dia` of the month after the period, moved to the next business day. */
  | { readonly tipo: 'mensual'; readonly dia: number }
  /** The period's last day: a review the founders do, not a filing. */
  | { readonly tipo: 'fin_de_mes' }
  /** A day of the year after the period's year, moved as `ajuste` says. */
  | {
      readonly tipo: 'anual';
      readonly mes: number;
      readonly dia: number;
      readonly ajuste: 'siguiente' | 'anterior';
    }
  /** `diasHabiles` after the event dated by the instance. */
  | { readonly tipo: 'evento'; readonly diasHabiles: number }
  /** The instance's own date is the due date (a certificate's expiry). */
  | { readonly tipo: 'fecha' };

export interface Plantilla {
  readonly id: string;
  readonly titulo: string;
  readonly autoridad: Autoridad;
  readonly fundamento: string;
  readonly regla: Regla;
  /** The steps after «pendiente», in order; «preparada» may be skipped. */
  readonly pasos: readonly Paso[];
  /** What proves a step; a step without an entry needs nothing. */
  readonly evidencia: Partial<Record<Paso, TipoEvidencia>>;
  /** How the boards name «presentada» for this one («Revisada», «Descargada»). */
  readonly etiquetaPresentada?: string;
  /** Not applicable to MEXIA: the reason, and the month to check it again. */
  readonly exenta: { readonly motivo: string; readonly revisar: string } | null;
}

export const esRecurrente = (p: Plantilla): boolean =>
  p.regla.tipo === 'mensual' || p.regla.tipo === 'fin_de_mes' || p.regla.tipo === 'anual';

const pad = (n: number) => String(n).padStart(2, '0');
const MES = /^(\d{4})-(0[1-9]|1[0-2])$/;
const ANIO = /^\d{4}$/;

function mes(periodo: string): readonly [number, number] {
  const m = MES.exec(periodo);
  if (m === null) throw new FechaInvalidaError(periodo);
  return [Number(m[1]), Number(m[2])];
}

function ultimoDia(year: number, month: number): string {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${pad(month)}-${pad(last)}`;
}

/** The date the rule names, before any business-day move. */
function nominal(regla: Regla, periodo: string): string {
  switch (regla.tipo) {
    case 'mensual': {
      const [y, m] = mes(periodo);
      const [ny, nm] = m === 12 ? [y + 1, 1] : [y, m + 1];
      // A day past the month's end means its last day (the DIOT's «día 31»).
      const ultimo = ultimoDia(ny, nm);
      return regla.dia >= Number(ultimo.slice(8)) ? ultimo : `${ny}-${pad(nm)}-${pad(regla.dia)}`;
    }
    case 'fin_de_mes':
      return ultimoDia(...mes(periodo));
    case 'anual':
      if (!ANIO.test(periodo)) throw new FechaInvalidaError(periodo);
      return `${Number(periodo) + 1}-${pad(regla.mes)}-${pad(regla.dia)}`;
    default:
      return periodo;
  }
}

export interface Vencimiento {
  /** What the rule says («el 17»). */
  readonly nominal: string;
  /** When it is actually due, after CFF art. 12. */
  readonly vence: string;
}

export function vencimiento(regla: Regla, periodo: string): Vencimiento {
  const n = nominal(regla, periodo);
  switch (regla.tipo) {
    case 'mensual':
      return { nominal: n, vence: siguienteDiaHabil(n) };
    case 'anual':
      return {
        nominal: n,
        vence: regla.ajuste === 'siguiente' ? siguienteDiaHabil(n) : anteriorDiaHabil(n),
      };
    case 'evento':
      return { nominal: n, vence: sumarDiasHabiles(n, regla.diasHabiles) };
    default:
      // A review at month end and a certificate's expiry are not moved.
      return { nominal: n, vence: n };
  }
}

export interface InstanciaEsperada {
  readonly plantillaId: string;
  readonly periodo: string;
  readonly nominal: string;
  readonly vence: string;
}

function periodos(p: Plantilla, inicio: string, hasta: string): string[] {
  if (p.regla.tipo === 'anual') {
    const out: string[] = [];
    for (let y = Number(inicio.slice(0, 4)); y <= Number(hasta.slice(0, 4)); y++)
      out.push(String(y));
    return out;
  }
  const out: string[] = [];
  let [y, m] = mes(inicio.slice(0, 7));
  const end = hasta.slice(0, 7);
  while (`${y}-${pad(m)}` <= end) {
    out.push(`${y}-${pad(m)}`);
    [y, m] = m === 12 ? [y + 1, 1] : [y, m + 1];
  }
  return out;
}

/**
 * Every recurring instance from MEXIA's SAT registration (`inicio`,
 * `YYYY-MM-DD`) that falls due on or before `hasta`. Exempt templates make
 * none; one-off templates are created by the founders, not computed.
 */
export function instanciasEsperadas(
  catalogo: readonly Plantilla[],
  inicio: string,
  hasta: string,
): readonly InstanciaEsperada[] {
  return catalogo
    .filter((p) => p.exenta === null && esRecurrente(p))
    .flatMap((p) =>
      periodos(p, inicio, hasta).map((periodo) => ({
        plantillaId: p.id,
        periodo,
        ...vencimiento(p.regla, periodo),
      })),
    )
    .filter((i) => i.vence <= hasta)
    .sort((a, b) => a.vence.localeCompare(b.vence) || a.plantillaId.localeCompare(b.plantillaId));
}
