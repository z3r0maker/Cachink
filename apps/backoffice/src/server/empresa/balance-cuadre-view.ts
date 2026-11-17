import { formatMoney } from '@xangarro/domain';
import {
  ACCOUNTS,
  type AccountKey,
  type Balance,
  type CuentaSocio,
  type Socio,
} from '@xangarro/domain/corp';

import { firmado } from './balance-view';
import { fechaCorta } from './fechas';

/**
 * Balance's check, partners and open account (E-12, board CD-08): the
 * «Activo = Pasivo + Capital» strip, «Lo que pusieron los socios», and the
 * movements an account opens into. Pure, like `balance-view.ts`.
 */
/** The movement behind an unknown account, as the check names it. */
export interface Desconocida {
  readonly fecha: string;
  readonly concepto: string;
  readonly cuenta: string;
}

export function cuadreDe(b: Balance, desconocida: Desconocida | null) {
  const activo = formatMoney(b.activo.total);
  const otro = formatMoney(b.pasivo.total + b.capital.total);
  if (b.diferencia === 0n) {
    return {
      cuadra: true,
      titulo: `${activo} = ${formatMoney(b.pasivo.total)} + ${formatMoney(b.capital.total)}`,
      texto:
        'Lo que tiene la empresa es igual a lo que debe más lo que pusieron y ganaron los socios.',
    };
  }
  const causa =
    desconocida === null
      ? 'Hay movimientos cuyos cargos y abonos no suman igual.'
      : `El movimiento del ${fechaCorta(desconocida.fecha)} «${desconocida.concepto}» usa la cuenta «${desconocida.cuenta}», que el balance no conoce.`;
  return {
    cuadra: false,
    titulo: `No cuadra por ${formatMoney(b.diferencia < 0n ? -b.diferencia : b.diferencia)}`,
    texto: `El activo suma ${activo} y el pasivo más el capital ${otro}. ${causa} Las cifras de abajo no son confiables hasta corregirlo.`,
  };
}

export interface FilaSocioBalance {
  readonly clave: string;
  readonly nombre: string;
  readonly capital: string;
  readonly aportaciones: string;
  readonly prestamo: string;
  readonly total: string;
}

/** «Lo que pusieron los socios»: each partner's capital, AFAC and loans, and the sum. */
export function filasSocios(
  cuentas: Readonly<Record<Socio, CuentaSocio>>,
  nombres: Readonly<Record<Socio, string>>,
): FilaSocioBalance[] {
  const fila = (
    clave: string,
    nombre: string,
    capital: bigint,
    aport: bigint,
    prestamo: bigint,
  ) => ({
    clave,
    nombre,
    capital: formatMoney(capital),
    aportaciones: formatMoney(aport),
    prestamo: formatMoney(prestamo),
    total: formatMoney(capital + aport + prestamo),
  });
  const de = (s: Socio) => cuentas[s];
  const aport = (s: Socio) => de(s).fondeo + de(s).adicional;
  return [
    ...([1, 2] as const).map((s) =>
      fila(`F${s}`, nombres[s], de(s).capital, aport(s), de(s).prestamo),
    ),
    fila(
      'total',
      'Total',
      de(1).capital + de(2).capital,
      aport(1) + aport(2),
      de(1).prestamo + de(2).prestamo,
    ),
  ];
}

/** An open account's lines, each signed on the account's own side. */
export function movimientosDeCuenta(
  cuenta: AccountKey,
  lineas: readonly {
    entryId: string;
    fecha: string;
    concepto: string;
    debe: bigint;
    haber: bigint;
  }[],
) {
  const deudora = ACCOUNTS[cuenta].naturaleza === 'deudora';
  return lineas.map((l) => ({
    entryId: l.entryId,
    fecha: fechaCorta(l.fecha),
    concepto: l.concepto,
    monto: firmado(deudora ? l.debe - l.haber : l.haber - l.debe),
  }));
}
