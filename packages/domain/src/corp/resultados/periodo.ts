/**
 * The periods Resultados reads (E-12, board CD-07): a month `2026-09`, a
 * quarter `2026-T3` or a year `2026`, each with its first and last day
 * (`YYYY-MM-DD`, inclusive). Dates compare as strings, so nothing here needs
 * a time zone.
 */
export type TipoPeriodo = 'mes' | 'trimestre' | 'anio';

export interface Periodo {
  readonly tipo: TipoPeriodo;
  readonly clave: string;
  readonly desde: string;
  readonly hasta: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const mesClave = (anio: number, mes: number) => `${anio}-${pad(mes)}`;
const ultimoDia = (anio: number, mes: number) => new Date(Date.UTC(anio, mes, 0)).getUTCDate();

function deMeses(tipo: TipoPeriodo, clave: string, anio: number, primero: number, ultimo: number) {
  return {
    tipo,
    clave,
    desde: `${mesClave(anio, primero)}-01`,
    hasta: `${mesClave(anio, ultimo)}-${pad(ultimoDia(anio, ultimo))}`,
  };
}

const mes = (anio: number, m: number): Periodo => deMeses('mes', mesClave(anio, m), anio, m, m);
const trimestre = (anio: number, t: number): Periodo =>
  deMeses('trimestre', `${anio}-T${t}`, anio, t * 3 - 2, t * 3);
const anio = (a: number): Periodo => deMeses('anio', String(a), a, 1, 12);

/** A period from its key, or null when the key names none. */
export function parsePeriodo(clave: string): Periodo | null {
  const m = /^(\d{4})(?:-(\d{2})|-T(\d))?$/.exec(clave);
  if (m === null) return null;
  const a = Number(m[1]);
  if (m[2] !== undefined) {
    const n = Number(m[2]);
    return n >= 1 && n <= 12 ? mes(a, n) : null;
  }
  if (m[3] !== undefined) {
    const t = Number(m[3]);
    return t >= 1 && t <= 4 ? trimestre(a, t) : null;
  }
  return anio(a);
}

/** The period of a kind that holds a day. */
export function periodoDe(tipo: TipoPeriodo, fecha: string): Periodo {
  const a = Number(fecha.slice(0, 4));
  const m = Number(fecha.slice(5, 7));
  if (tipo === 'mes') return mes(a, m);
  if (tipo === 'trimestre') return trimestre(a, Math.ceil(m / 3));
  return anio(a);
}

/** The period of the same kind just before. */
export function periodoAnterior(p: Periodo): Periodo {
  const a = Number(p.desde.slice(0, 4));
  const m = Number(p.desde.slice(5, 7));
  if (p.tipo === 'anio') return anio(a - 1);
  const atras = p.tipo === 'mes' ? 1 : 3;
  const total = a * 12 + (m - 1) - atras;
  return periodoDe(p.tipo, `${mesClave(Math.floor(total / 12), (total % 12) + 1)}-01`);
}

/** Whether a day falls inside the period, its edges included. */
export const enPeriodo = (fecha: string, p: Periodo): boolean =>
  fecha >= p.desde && fecha <= p.hasta;

/** The `n` months that end at `ultimo` (`YYYY-MM`), oldest first. */
export function mesesHasta(ultimo: string, n: number): string[] {
  const fin = Number(ultimo.slice(0, 4)) * 12 + Number(ultimo.slice(5, 7)) - 1;
  return Array.from({ length: n }, (_, i) => {
    const t = fin - (n - 1 - i);
    return mesClave(Math.floor(t / 12), (t % 12) + 1);
  });
}

/** The months a period spans, oldest first. */
export const mesesDe = (p: Periodo): string[] => {
  const n = p.tipo === 'mes' ? 1 : p.tipo === 'trimestre' ? 3 : 12;
  return mesesHasta(p.hasta.slice(0, 7), n);
};
