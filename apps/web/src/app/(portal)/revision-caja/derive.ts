import { calcularMargenProducto, formatMoney, sum, type Money } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { enPalabras } from '../../../operador/inicio/copy';

import type { ClienteCaja } from './types';

/** «Dos clientes nuevos sin límite ni plazo». */
export function fiadoSinLimite(clientes: readonly ClienteCaja[]): { monto: Money; hint: string } {
  const n = clientes.length;
  return {
    monto: sum(clientes.map((c) => c.fiado)),
    hint:
      n === 1
        ? 'Un cliente nuevo sin límite ni plazo'
        : `${enPalabras(n)} clientes nuevos sin límite ni plazo`,
  };
}

/** Whole-percent margin from the domain, or `null` until both figures are positive. */
export function margen(precio: Money | null, costo: Money | null): number | null {
  if (precio === null || costo === null || costo <= 0n) return null;
  const m = calcularMargenProducto(costo, precio);
  return m ? Math.round(m.margenPct) : null;
}

/** The file's traffic light: 40 % and up green, 20 % and up yellow, below red. */
export function semaforo(m: number | null): string {
  if (m === null) return colors.gray100;
  if (m >= 40) return colors.greenSoft;
  return m >= 20 ? colors.yellowSoft : colors.redSoft;
}

export const aprobadoProducto = (nombre: string, costo: Money, m: number | null) =>
  `${nombre} entra al catálogo con costo ${formatMoney(costo)} y margen ${m ?? 0}%. Ya calcula utilidad en tus estados.`;

export const aprobadoCliente = (nombre: string, limite: Money, plazo: string) =>
  `${nombre} queda con límite ${formatMoney(limite)} y plazo ${plazo}.`;

export const rechazado = (nombre: string) =>
  `${nombre} ya no se puede vender en caja. Las ventas capturadas quedan para clasificar en Ventas y gastos.`;

export const fusionado = (nombre: string, con: string) =>
  `${nombre} se fusionó con ${con}. Las ventas capturadas se movieron a ese registro.`;

export const avisoRechazo = (esProducto: boolean, nombre: string) => ({
  tint: colors.redSoft,
  title: esProducto ? 'Producto rechazado' : 'Cliente rechazado',
  body: rechazado(nombre),
});

export const avisoFusion = (nombre: string, con: string) => ({
  tint: colors.blueSoft,
  title: 'Registros fusionados',
  body: fusionado(nombre, con),
});
