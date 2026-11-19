import type {
  LlamadaConEstado,
  MovimientoCajaDeEntrada,
  SaldoConfirmado,
} from '@xangarro/data-corp';
import { formatMoney } from '@xangarro/domain';
import {
  reservaMinima,
  ultimoDia,
  type Autonomia,
  type CuentaSocio,
  type RecurrenteDelMes,
  type Socio,
} from '@xangarro/domain/corp';

import { hrefCierre } from './cierre-view';
import { fechaLarga, nombreMes } from './fechas';
import type { MesImpuestos } from './impuestos-view';
import { mesesVecinos } from './movimiento-view';
import { llamadaAbierta } from './socios-view';

/**
 * Caja (E-23, board CD-15c): what the page reads, its five tiles and the
 * warning when cash is below the minimum reserve. Pure; the chart is
 * `caja-grafica.ts`, the three panels `caja-paneles.ts`.
 */
export interface DatosCaja {
  /** `YYYY-MM-DD` in Mexico. */
  readonly hoy: string;
  readonly movs: readonly MovimientoCajaDeEntrada[];
  /** Centavos at the end of today. */
  readonly saldos: { readonly bancos: bigint; readonly stripe: bigint };
  readonly confirmado: SaldoConfirmado | null;
  readonly calls: readonly LlamadaConEstado[];
  readonly cuentas: Readonly<Record<Socio, CuentaSocio>>;
  /** «Fundador 1 · <nombre>». */
  readonly socios: Readonly<Record<Socio, string>>;
  /** This month's and the next one's recurring charges. */
  readonly recurrentes: readonly RecurrenteDelMes[];
  /** Last month's and this one's ISR e IVA, those the ledger estimates. */
  readonly impuestos: readonly MesImpuestos[];
}

export interface Tile {
  readonly label: string;
  readonly valor: string;
  readonly nota: string;
  readonly hero: boolean;
  readonly enlace: { readonly texto: string; readonly href: string } | null;
}

const tile = (label: string, valor: string, nota: string, hero = false): Tile => ({
  label,
  valor,
  nota,
  hero,
  enlace: null,
});

function bancos(d: DatosCaja): Tile {
  const c = d.confirmado;
  const nota =
    c === null
      ? 'Aún sin confirmar en un cierre del mes'
      : `Confirmado al ${fechaLarga(ultimoDia(c.periodo))} en el cierre: ${formatMoney(c.saldo)}`;
  const mes = c?.periodo ?? mesesVecinos(d.hoy.slice(0, 7)).anterior;
  return {
    ...tile('Bancos', formatMoney(d.saldos.bancos), nota),
    enlace: { texto: `Ver el cierre de ${nombreMes(mes)}`, href: hrefCierre(mes) },
  };
}

const unDecimal = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 1 });

function meses(a: Autonomia): Tile {
  if (a.mesesDeCaja === null) {
    return tile('Meses de caja', 'Sin consumo', 'Lo que entra cubre lo que sale');
  }
  return tile(
    'Meses de caja',
    unDecimal(a.mesesDeCaja),
    `Caja ÷ consumo de ${formatMoney(-a.neto)} al mes`,
  );
}

/** «de ago a oct»: the months `autonomia` averaged, the three before this one. */
function promedio(hoy: string, n: number): string {
  if (n <= 1) return 'Del mes';
  let desde = hoy.slice(0, 7);
  for (let i = 0; i < n; i++) desde = mesesVecinos(desde).anterior;
  const hasta = mesesVecinos(hoy.slice(0, 7)).anterior;
  const corto = (m: string) => nombreMes(m).slice(0, 3);
  return `Promedio de ${corto(desde)} a ${corto(hasta)}`;
}

export function tilesDe(d: DatosCaja, a: Autonomia): readonly Tile[] {
  return [
    tile('Caja', formatMoney(a.caja), 'Bancos más lo que Stripe aún no deposita', true),
    bancos(d),
    tile(
      'Stripe por depositar',
      formatMoney(d.saldos.stripe),
      'Lo cobrado con tarjeta, hasta que se registre su depósito al banco',
    ),
    tile(
      'Gasto al mes',
      formatMoney(a.sale),
      `${promedio(d.hoy, a.mesesConDatos)}, sin el dinero de los socios`,
    ),
    meses(a),
  ];
}

export interface AvisoReserva {
  readonly texto: string;
  readonly enlace: string;
}

/** Below the reserve, with the open funding call if there is one. */
export function avisoDe(d: DatosCaja, a: Autonomia): AvisoReserva | null {
  const reserva = reservaMinima(a.sale);
  if (reserva === 0n || a.caja >= reserva) return null;
  const base = `Hay ${formatMoney(a.caja)} y la reserva es de ${formatMoney(reserva)} (3 meses de gastos).`;
  const call = llamadaAbierta(d.calls);
  if (call === null) return { texto: `${base} No hay un fondeo abierto.`, enlace: 'Pedir fondeo' };
  const falta = ([1, 2] as const).filter((s) => call.mitades[s] === null).map((s) => d.socios[s]);
  return {
    texto: `${base} El fondeo «${call.concepto}» espera la mitad de ${falta.join(' y ')}.`,
    enlace: 'Ver el fondeo',
  };
}
