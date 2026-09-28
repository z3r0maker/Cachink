/**
 * «¿Qué pasó con la mercancía?» on the phone (MvInventario's sheet; the web's
 * `inventario/mover.tsx`): whole quantities only, since the domain counts
 * units in integers; a merma can't take more than there is and always says
 * what happened; the detalle joins the reason (or who brought it) and the
 * note with «·», as the web records it. Pure.
 */
import {
  conUnidad,
  type Existencia,
  type MotivoMerma,
  type TipoMovimiento,
} from '@xangarro/caja/inventario';

/** A write-off starts at one; a delivery at five, as the board has it. */
export const INICIAL: Readonly<Record<TipoMovimiento, number>> = { Merma: 1, Entrada: 5 };

export interface Borrador {
  readonly tipo: TipoMovimiento;
  readonly cantidad: number;
  readonly motivo: MotivoMerma | null;
  readonly proveedor: string;
  readonly nota: string;
}

export const borradorInicial = (tipo: TipoMovimiento): Borrador => ({
  tipo,
  cantidad: INICIAL[tipo],
  motivo: null,
  proveedor: '',
  nota: '',
});

/** Low stock opens «Llegó mercancía»; the rest opens the merma (the board's `abrir`). */
export const tipoAlAbrir = (e: Existencia): TipoMovimiento =>
  e.existencias <= e.umbral ? 'Entrada' : 'Merma';

export const alcanza = (b: Borrador, e: Existencia): boolean =>
  b.tipo !== 'Merma' || b.cantidad <= e.existencias;

export const listo = (b: Borrador, e: Existencia): boolean =>
  Number.isInteger(b.cantidad) &&
  b.cantidad > 0 &&
  alcanza(b, e) &&
  (b.tipo !== 'Merma' || b.motivo !== null);

/** The stepper: one at least, never past the stock on a merma. */
export function paso(b: Borrador, e: Existencia, delta: number): number {
  const tope = b.tipo === 'Merma' ? Math.max(1, e.existencias) : Number.MAX_SAFE_INTEGER;
  return Math.min(tope, Math.max(1, Math.round(b.cantidad + delta)));
}

/** «Te van a quedar 6 kg», «Vas a tener 13 kg, abajo del aviso», «Solo hay 2 kg.». */
export function quedan(b: Borrador, e: Existencia): string {
  if (!alcanza(b, e)) return `Solo hay ${conUnidad(e.existencias, e.unidad)}.`;
  const merma = b.tipo === 'Merma';
  const despues = merma ? e.existencias - b.cantidad : e.existencias + b.cantidad;
  const aviso = despues <= e.umbral ? ', abajo del aviso' : '';
  return `${merma ? 'Te van a quedar' : 'Vas a tener'} ${conUnidad(despues, e.unidad)}${aviso}`;
}

export function detalle(b: Borrador): string {
  const partes =
    b.tipo === 'Merma' ? [b.motivo ?? '', b.nota.trim()] : [b.proveedor.trim(), b.nota.trim()];
  return partes.filter(Boolean).join(' · ');
}

export const cta = (b: Borrador, e: Existencia): string =>
  `Registrar ${b.tipo === 'Merma' ? 'merma' : 'entrada'} de ${conUnidad(b.cantidad, e.unidad)}`;

/** «−3 de Carne de pastor · Se rompió. Queda en tu turno.» (the web's toast). */
export function avisoHecho(b: Borrador, e: Existencia): string {
  const signo = b.tipo === 'Merma' ? '−' : '+';
  const motivo = b.tipo === 'Merma' && b.motivo ? ` · ${b.motivo}` : '';
  return `${signo}${conUnidad(b.cantidad, e.unidad)} de ${e.nombre}${motivo}. Queda en tu turno.`;
}
