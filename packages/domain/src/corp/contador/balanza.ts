import type { Money } from '../../money/index.js';
import { RESULTADOS } from '../balance/balance.js';
import { ACCOUNTS, isAccountKey, type Naturaleza } from '../ledger/accounts.js';
import { MontoInvalidoError } from '../ledger/errors.js';
import { CUENTAS_DEL_CATALOGO, type Codigos } from './codigos.js';

/**
 * A month's balanza de comprobación (E-43, board CD-10d): each of the chart's
 * accounts, moved or not, with its opening balance, the month's debits and
 * credits, and its closing balance, on the account's own side.
 *
 * There are no closing entries (as in Balance, E-12): a result account starts
 * each year at zero, and what earlier years left in them opens in
 * Resultados acumulados. So the closing debit balances equal the credit ones,
 * as the month's debits equal its credits. Pure.
 */
export type Tramo = 'anterior' | 'ejercicio' | 'mes';

/**
 * An account's sums over one stretch: `anterior` before the month's year,
 * `ejercicio` from the year's first day to before the month, `mes` the month.
 */
export interface SumaDelTramo {
  readonly cuenta: string;
  readonly tramo: Tramo;
  /** Centavos, never negative. */
  readonly debe: Money;
  readonly haber: Money;
}

export interface FilaBalanza {
  /** The chart's key, or the raw account of a line the chart does not know. */
  readonly cuenta: string;
  readonly nombre: string;
  readonly naturaleza: Naturaleza;
  readonly codigo: string | null;
  readonly inicial: Money;
  readonly debe: Money;
  readonly haber: Money;
  readonly final: Money;
}

export interface Balanza {
  readonly filas: readonly FilaBalanza[];
  /** The month's debits and credits, all accounts. */
  readonly debe: Money;
  readonly haber: Money;
  readonly cuadra: boolean;
  /** Chart accounts with no código agrupador. */
  readonly sinCodigo: readonly string[];
  /** Accounts with lines the chart does not know: shown apart, as debit ones. */
  readonly sinClasificar: readonly string[];
}

type Sumas = Record<Tramo, { debe: Money; haber: Money }>;

const vacias = (): Sumas => ({
  anterior: { debe: 0n, haber: 0n },
  ejercicio: { debe: 0n, haber: 0n },
  mes: { debe: 0n, haber: 0n },
});

function porCuenta(sumas: readonly SumaDelTramo[]): Map<string, Sumas> {
  const out = new Map<string, Sumas>();
  for (const s of sumas) {
    if (s.debe < 0n || s.haber < 0n)
      throw new MontoInvalidoError(`la suma de ${s.cuenta} es negativa`);
    const acc = out.get(s.cuenta) ?? vacias();
    acc[s.tramo].debe += s.debe;
    acc[s.tramo].haber += s.haber;
    out.set(s.cuenta, acc);
  }
  return out;
}

const lado = (n: Naturaleza, debe: Money, haber: Money): Money =>
  n === 'deudora' ? debe - haber : haber - debe;

function fila(
  cuenta: string,
  s: Sumas,
  apertura: { naturaleza: Naturaleza; nombre: string; codigo: string | null; desde: Money },
): FilaBalanza {
  const { naturaleza } = apertura;
  const inicial = apertura.desde;
  const { debe, haber } = s.mes;
  return {
    cuenta,
    nombre: apertura.nombre,
    naturaleza,
    codigo: apertura.codigo,
    inicial,
    debe,
    haber,
    final: inicial + lado(naturaleza, debe, haber),
  };
}

/** What earlier years left in the result accounts, on the credit side. */
function resultadosAnteriores(sumas: ReadonlyMap<string, Sumas>): Money {
  let total = 0n;
  for (const [cuenta, s] of sumas)
    if (isAccountKey(cuenta) && RESULTADOS.includes(ACCOUNTS[cuenta].grupo))
      total += s.anterior.haber - s.anterior.debe;
  return total;
}

function filaDelCatalogo(
  cuenta: (typeof CUENTAS_DEL_CATALOGO)[number],
  s: Sumas,
  codigos: Codigos,
  previos: Money,
) {
  const a = ACCOUNTS[cuenta];
  const deResultados = RESULTADOS.includes(a.grupo);
  const debe = s.ejercicio.debe + (deResultados ? 0n : s.anterior.debe);
  const haber = s.ejercicio.haber + (deResultados ? 0n : s.anterior.haber);
  const extra = cuenta === 'resultados_acumulados' ? previos : 0n;
  return fila(cuenta, s, {
    naturaleza: a.naturaleza,
    nombre: a.nombre,
    codigo: codigos.get(cuenta) ?? null,
    desde: lado(a.naturaleza, debe, haber) + extra,
  });
}

export function balanzaDelMes(sumas: readonly SumaDelTramo[], codigos: Codigos): Balanza {
  const por = porCuenta(sumas);
  const previos = resultadosAnteriores(por);
  const delCatalogo = CUENTAS_DEL_CATALOGO.map((c) =>
    filaDelCatalogo(c, por.get(c) ?? vacias(), codigos, previos),
  );
  const sinClasificar = [...por.keys()].filter((c) => !isAccountKey(c)).sort();
  const otras = sinClasificar.map((c) => {
    const s = por.get(c) ?? vacias();
    const debe = s.anterior.debe + s.ejercicio.debe;
    const haber = s.anterior.haber + s.ejercicio.haber;
    return fila(c, s, { naturaleza: 'deudora', nombre: c, codigo: null, desde: debe - haber });
  });
  const filas = [...delCatalogo, ...otras];
  const total = (f: (x: FilaBalanza) => Money) => filas.reduce((t, x) => t + f(x), 0n);
  const debe = total((f) => f.debe);
  const haber = total((f) => f.haber);
  const saldos = total((f) => (f.naturaleza === 'deudora' ? f.final : -f.final));
  return {
    filas,
    debe,
    haber,
    cuadra: debe === haber && saldos === 0n && sinClasificar.length === 0,
    sinCodigo: delCatalogo.filter((f) => f.codigo === null).map((f) => f.cuenta),
    sinClasificar,
  };
}
