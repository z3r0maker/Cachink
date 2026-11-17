import type { Money } from '../../money/index.js';
import { ACCOUNTS, isAccountKey, type AccountGroup, type AccountKey } from '../ledger/accounts.js';
import { MontoInvalidoError } from '../ledger/errors.js';

/**
 * The balance sheet (E-12, board CD-08) from the ledger's sums per account.
 *
 * There are no closing entries: the P&L accounts are never zeroed into
 * `resultados_acumulados`. So the year's result is read from them directly,
 * and a past year's result is added to `resultados_acumulados` here.
 *
 * Every entry balances (a trigger holds it), so Activo = Pasivo + Capital by
 * construction. What breaks it is a line in an account the chart does not
 * know: `sinClasificar` names it, and `diferencia` is how far off it puts the
 * sheet.
 */
export interface SumaDeCuenta {
  readonly cuenta: string;
  /** Lines dated before the year of the balance's day. */
  readonly previo: boolean;
  /** Centavos, never negative. */
  readonly debe: Money;
  readonly haber: Money;
  /** One entry with a line here: what «Ver el movimiento» opens for an unknown account. */
  readonly entryId: string;
}

export interface GrupoBalance {
  /** Every account of the group, in the chart's order, with its balance on its own side. */
  readonly saldos: ReadonlyMap<AccountKey, Money>;
  readonly total: Money;
}

export interface Balance {
  readonly activo: GrupoBalance;
  readonly pasivo: GrupoBalance;
  /** The capital accounts plus the year's result, which `total` includes. */
  readonly capital: GrupoBalance & { readonly resultadoDelEjercicio: Money };
  /** Activo − (Pasivo + Capital): zero when the sheet balances. */
  readonly diferencia: Money;
  readonly sinClasificar: readonly { readonly cuenta: string; readonly entryId: string }[];
  /** No line at all up to the day. */
  readonly vacio: boolean;
}

const RESULTADOS: readonly AccountGroup[] = ['ingreso', 'costo', 'gasto', 'otro'];

/** The chart's accounts of one group, in the chart's own order. */
export function cuentasDelGrupo(grupo: AccountGroup): AccountKey[] {
  return (Object.keys(ACCOUNTS) as AccountKey[]).filter((k) => ACCOUNTS[k].grupo === grupo);
}

/** The balance on the account's own side: a debit balance for an asset, credit otherwise. */
function saldo(cuenta: AccountKey, debe: Money, haber: Money): Money {
  return ACCOUNTS[cuenta].naturaleza === 'deudora' ? debe - haber : haber - debe;
}

function grupo(saldos: ReadonlyMap<AccountKey, Money>, cuentas: AccountKey[]): GrupoBalance {
  const propios = new Map(cuentas.map((c) => [c, saldos.get(c) ?? 0n] as const));
  return { saldos: propios, total: [...propios.values()].reduce((t, v) => t + v, 0n) };
}

export function balanceGeneral(sumas: readonly SumaDeCuenta[]): Balance {
  const saldos = new Map<AccountKey, Money>();
  const sinClasificar: { cuenta: string; entryId: string }[] = [];
  let delEjercicio = 0n;
  let previos = 0n;
  for (const s of sumas) {
    if (s.debe < 0n || s.haber < 0n)
      throw new MontoInvalidoError(`la suma de ${s.cuenta} es negativa`);
    if (!isAccountKey(s.cuenta)) {
      sinClasificar.push({ cuenta: s.cuenta, entryId: s.entryId });
    } else if (RESULTADOS.includes(ACCOUNTS[s.cuenta].grupo)) {
      if (s.previo) previos += s.haber - s.debe;
      else delEjercicio += s.haber - s.debe;
    } else {
      saldos.set(s.cuenta, (saldos.get(s.cuenta) ?? 0n) + saldo(s.cuenta, s.debe, s.haber));
    }
  }
  saldos.set('resultados_acumulados', (saldos.get('resultados_acumulados') ?? 0n) + previos);
  const activo = grupo(saldos, cuentasDelGrupo('activo'));
  const pasivo = grupo(saldos, cuentasDelGrupo('pasivo'));
  const propio = grupo(saldos, cuentasDelGrupo('capital'));
  const capital = {
    ...propio,
    total: propio.total + delEjercicio,
    resultadoDelEjercicio: delEjercicio,
  };
  return {
    activo,
    pasivo,
    capital,
    diferencia: activo.total - pasivo.total - capital.total,
    sinClasificar,
    vacio: sumas.length === 0,
  };
}
