import { formatMoney, formatMoneyEntero, formatMonth } from '@xangarro/domain';
import { autonomia, mesesHasta, type Autonomia, type MovimientoCaja } from '@xangarro/domain/corp';

/**
 * «Autonomía sin nuevo capital», Resumen's hero (E-16): the domain's figures
 * in the words of boards CD-12 (it sustains itself), CD-12b (the partners
 * still fund it) and CD-12c (nothing recorded yet). Pure.
 */
export interface Tarjeta {
  readonly etiqueta: string;
  readonly valor: string;
  readonly nota: string;
  /** The «si los ingresos se detuvieran» card, drawn as a warning. */
  readonly aviso: boolean;
}

export type Hero =
  | { readonly estado: 'sinDatos' }
  | {
      readonly estado: 'autosuficiente' | 'fondeo';
      readonly titulo: string;
      readonly explica: string;
      readonly insignia: string;
      readonly tarjetas: readonly [Tarjeta, Tarjeta, Tarjeta];
      readonly pie: string;
    };

/** Months averaged (plan §4): the three whole months before today. */
export const MESES_PROMEDIO = 3;

/**
 * The hero as of today. A company whose first movement is this month has no
 * whole month yet, so the running one stands in rather than showing nothing.
 */
export function autonomiaDeHoy(movs: readonly MovimientoCaja[], hoy: string): Autonomia {
  const mes = hoy.slice(0, 7);
  const previos = mesesHasta(mes, MESES_PROMEDIO + 1).slice(0, MESES_PROMEDIO);
  const a = autonomia(movs, hoy, previos);
  return a.mesesConDatos === 0 && movs.some((m) => m.fecha <= hoy)
    ? autonomia(movs, hoy, [mes])
    : a;
}

const entero = (v: bigint) => formatMoneyEntero(v).replace('-', '−');

const unDecimal = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 1 });

const enMeses = (n: number) => `${unDecimal(n)} ${n === 1 ? 'mes' : 'meses'}`;

/** «abril de 2027»: the month the cash reaches, counting whole months from this one. */
function mesDe(hoy: string, meses: number): string {
  const t = Number(hoy.slice(0, 4)) * 12 + Number(hoy.slice(5, 7)) - 1 + Math.floor(meses);
  return formatMonth(`${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`);
}

function sinIngresos(a: Autonomia, hoy: string): Tarjeta {
  const m = a.mesesSinIngresos;
  const etiqueta = 'Si los ingresos se detuvieran hoy';
  if (m === null) {
    return {
      etiqueta,
      valor: 'Sin límite',
      nota: 'No hubo gastos en los últimos meses.',
      aviso: true,
    };
  }
  const nota =
    m === 0
      ? 'La caja ya no alcanza para los gastos actuales.'
      : `La caja alcanza hasta ${mesDe(hoy, m)} con los gastos actuales.`;
  return { etiqueta, valor: enMeses(m), nota, aviso: true };
}

function veces(equilibrio: bigint, entra: bigint): string {
  return unDecimal(Math.trunc(Number((equilibrio * 10n) / entra)) / 10);
}

function fondeo(a: Autonomia, hoy: string): readonly [Tarjeta, Tarjeta, Tarjeta] {
  const m = a.mesesDeCaja ?? 0;
  const equilibrio = a.equilibrio ?? a.sale;
  return [
    {
      etiqueta: 'Si los ingresos se mantienen',
      valor: enMeses(m),
      nota:
        m === 0
          ? 'La caja ya no alcanza. Hay que poner dinero.'
          : `La caja alcanza hasta ${mesDe(hoy, m)}. Después habría que poner dinero.`,
      aviso: false,
    },
    {
      etiqueta: 'Para dejar de poner dinero',
      valor: `${entero(equilibrio)} al mes`,
      nota:
        a.entra > 0n
          ? `de ingresos: ${veces(equilibrio, a.entra)} veces lo de hoy. Es el punto de equilibrio.`
          : 'de ingresos. Hoy no entra nada. Es el punto de equilibrio.',
      aviso: false,
    },
    sinIngresos(a, hoy),
  ];
}

function sostenida(a: Autonomia, hoy: string): readonly [Tarjeta, Tarjeta, Tarjeta] {
  const caida = a.caidaMaximaBps;
  return [
    {
      etiqueta: 'Si los ingresos se mantienen',
      valor: 'Sin límite',
      nota: `La caja llegaría a ${entero(a.enDoceMeses ?? a.caja)} en ${mesDe(hoy, 12)}.`,
      aviso: false,
    },
    {
      etiqueta: 'Si los ingresos bajan',
      valor: caida === null ? 'Sin datos' : `Hasta ${Math.trunc(caida / 100)} %`,
      nota: `y aún no hay que poner dinero. Punto de equilibrio: ${entero(a.equilibrio ?? a.sale)} al mes.`,
      aviso: false,
    },
    sinIngresos(a, hoy),
  ];
}

function promedio(n: number): string {
  return n === 1 ? 'el promedio del último mes' : `el promedio de los últimos ${n} meses`;
}

export function heroDe(a: Autonomia, hoy: string): Hero {
  if (a.autosuficiente === null || (a.entra === 0n && a.sale === 0n)) return { estado: 'sinDatos' };
  const pie =
    `Con caja de ${formatMoney(a.caja).replace('-', '−')} y ${promedio(a.mesesConDatos)}: ` +
    `entran ${entero(a.entra)} y salen ${entero(a.sale)} al mes, sin contar el dinero de los socios.`;
  if (!a.autosuficiente) {
    return {
      estado: 'fondeo',
      titulo: 'La operación aún depende de los socios',
      explica: `Cada mes salen ${entero(-a.neto)} más de los que entran. La diferencia sale de la caja que pusieron los socios.`,
      insignia: 'Necesita fondeo',
      tarjetas: fondeo(a, hoy),
      pie,
    };
  }
  return {
    estado: 'autosuficiente',
    titulo: 'La operación se sostiene sola',
    explica:
      a.neto === 0n
        ? 'Con los ingresos de hoy, entra lo mismo que sale cada mes. La caja se mantiene.'
        : `Con los ingresos de hoy, entran ${entero(a.neto)} más de los que salen cada mes. La caja crece.`,
    insignia: 'Autosuficiente',
    tarjetas: sostenida(a, hoy),
    pie,
  };
}
