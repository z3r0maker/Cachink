import { formatMoney } from '@xangarro/domain';
import {
  ACCOUNTS,
  cuentasDelGrupo,
  isAccountKey,
  type AccountKey,
  type Balance,
  type GrupoBalance,
} from '@xangarro/domain/corp';

import { fechaCorta, fechaLarga, sumarDias } from './fechas';
import { mesesVecinos, parseMes } from './movimiento-view';

/**
 * Balance's view (E-12, board CD-08): what the URL asks for, the sheet's two
 * sides against the previous month, the «Activo = Pasivo + Capital» check and
 * the partners' table. Pure: the page reads, this shapes.
 */
export interface VistaBalance {
  /** `YYYY-MM`, never after this month. */
  readonly mes: string;
  /** The account whose month of movements is shown under it. */
  readonly abrir: AccountKey | null;
  /** The sheet's day: the month's last, or today in this month. */
  readonly hasta: string;
  /** The previous month's last day. */
  readonly hastaAnterior: string;
  readonly esMesActual: boolean;
}

const ultimoDia = (mes: string) => sumarDias(`${mesesVecinos(mes).siguiente}-01`, -1);
const DEL_BALANCE: readonly string[] = ['activo', 'pasivo', 'capital'];

export function parseVistaBalance(
  q: { readonly mes?: string; readonly abrir?: string },
  hoy: string,
): VistaBalance {
  const actual = hoy.slice(0, 7);
  const pedido = parseMes(q.mes, hoy);
  const mes = pedido > actual ? actual : pedido;
  const abrir =
    q.abrir !== undefined && isAccountKey(q.abrir) && DEL_BALANCE.includes(ACCOUNTS[q.abrir].grupo)
      ? q.abrir
      : null;
  return {
    mes,
    abrir,
    hasta: mes === actual ? hoy : ultimoDia(mes),
    hastaAnterior: ultimoDia(mesesVecinos(mes).anterior),
    esMesActual: mes === actual,
  };
}

export function hrefBalance(
  v: VistaBalance,
  cambio: Partial<Pick<VistaBalance, 'mes' | 'abrir'>> = {},
) {
  const n = { mes: v.mes, abrir: v.abrir, ...cambio };
  const q = new URLSearchParams({ mes: n.mes });
  if (n.abrir !== null) q.set('abrir', n.abrir);
  return `/empresa/balance?${q.toString()}`;
}

/** «Al 31 de octubre de 2026». */
export const fechaDelBalance = (v: VistaBalance) =>
  `Al ${fechaLarga(v.hasta)} de ${v.hasta.slice(0, 4)}`;

/** `−$1,234.50`: a minus sign, never parentheses, as the board writes a loss. */
export const firmado = (c: bigint) => (c < 0n ? `−${formatMoney(-c)}` : formatMoney(c));

export interface CuentaVista {
  readonly id: AccountKey | 'resultado';
  readonly nombre: string;
  readonly nota: string;
  readonly actual: string;
  readonly anterior: string;
  readonly negativo: boolean;
  readonly href: string;
  readonly abierta: boolean;
}

export interface GrupoVista {
  readonly nombre: string;
  readonly totalNombre: string;
  readonly total: string;
  readonly totalAnterior: string;
  readonly cuentas: readonly CuentaVista[];
}

function nota(cuenta: AccountKey, v: VistaBalance): string {
  const sat = `se paga al SAT el ${fechaCorta(`${mesesVecinos(v.mes).siguiente}-17`)}`;
  const NOTAS: Partial<Record<AccountKey, string>> = {
    bancos: 'Cuenta de MEXIA',
    stripe_por_depositar: 'Cobros de Stripe que aún no llegan al banco',
    iva_acreditable: 'IVA de gastos pagados',
    iva_por_acreditar: 'IVA de facturas a crédito sin pagar',
    isr_pagos_provisionales: 'Se acreditan en la declaración anual',
    proveedores: 'Facturas recibidas a crédito',
    iva_trasladado: `IVA de lo cobrado: ${sat}`,
    isr_por_pagar: `ISR del mes: ${sat}`,
    iva_por_pagar: `IVA del mes: ${sat}`,
    retenciones_por_pagar: 'ISR e IVA retenidos a proveedores',
    prestamos_socios: 'Sin intereses',
    capital_social: 'Acciones pagadas',
    afac: 'Fondeo de los socios',
    resultados_acumulados: 'De años anteriores',
  };
  return NOTAS[cuenta] ?? '';
}

type Grupo = 'activo' | 'pasivo' | 'capital';
const NOMBRES: Record<Grupo, string> = { activo: 'Activo', pasivo: 'Pasivo', capital: 'Capital' };

function grupoVista(
  id: Grupo,
  actual: GrupoBalance,
  anterior: GrupoBalance,
  v: VistaBalance,
): GrupoVista {
  const cuentas = cuentasDelGrupo(id)
    .map((c) => ({ c, a: actual.saldos.get(c) ?? 0n, b: anterior.saldos.get(c) ?? 0n }))
    .filter(({ a, b }) => id === 'capital' || a !== 0n || b !== 0n)
    .map(({ c, a, b }) => ({
      id: c,
      nombre: ACCOUNTS[c].nombre,
      nota: nota(c, v),
      actual: firmado(a),
      anterior: firmado(b),
      negativo: a < 0n,
      href: hrefBalance(v, { abrir: v.abrir === c ? null : c }),
      abierta: v.abrir === c,
    }));
  return {
    nombre: NOMBRES[id],
    totalNombre: `Total ${NOMBRES[id].toLowerCase()}`,
    total: firmado(actual.total),
    totalAnterior: firmado(anterior.total),
    cuentas,
  };
}

function resultadoVista(actual: Balance, anterior: Balance, v: VistaBalance): CuentaVista {
  const r = actual.capital.resultadoDelEjercicio;
  const anio = v.hasta.slice(0, 4);
  return {
    id: 'resultado',
    nombre: 'Resultado del ejercicio',
    nota: `${r < 0n ? 'Pérdida' : 'Utilidad'} de ${anio}, del estado de resultados`,
    actual: firmado(r),
    anterior: firmado(anterior.capital.resultadoDelEjercicio),
    negativo: r < 0n,
    href: `/empresa/resultados?periodo=${anio}`,
    abierta: false,
  };
}

/** The two sides of the sheet: Activo, then Pasivo and Capital with the year's result. */
export function ladosDe(actual: Balance, anterior: Balance, v: VistaBalance) {
  const capital = grupoVista('capital', actual.capital, anterior.capital, v);
  return [
    [grupoVista('activo', actual.activo, anterior.activo, v)],
    [
      grupoVista('pasivo', actual.pasivo, anterior.pasivo, v),
      { ...capital, cuentas: [...capital.cuentas, resultadoVista(actual, anterior, v)] },
    ],
  ] as const;
}
