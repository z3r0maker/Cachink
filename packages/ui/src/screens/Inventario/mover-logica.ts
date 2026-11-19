/**
 * «¿Qué pasó con la mercancía?» on the phone (RvInventario; M9, item 6): the
 * row opens the kind its stock calls for, the quantity is typed or stepped in
 * whole units (the domain counts in integers), a merma can't take more than
 * there is and always says what happened. Pure: the sheet holds a `Borrador`
 * and asks these what to say and what to write.
 */
import {
  cantidadValida,
  conUnidad,
  type Existencia,
  type MotivoMerma,
  type NuevoMovimientoVivo,
  type TipoMovimiento,
} from '@xangarro/caja/inventario';

/** A write-off starts at one; a delivery at five, as the board has it. */
export const INICIAL: Readonly<Record<TipoMovimiento, string>> = { Merma: '1', Entrada: '5' };

export interface Borrador {
  readonly tipo: TipoMovimiento;
  /** What the field holds, digits only; `cantidadValida` says if it counts. */
  readonly raw: string;
  readonly motivo: MotivoMerma | null;
}

export const borradorInicial = (tipo: TipoMovimiento): Borrador => ({
  tipo,
  raw: INICIAL[tipo],
  motivo: null,
});

/** Low stock opens «Llegó mercancía»; the rest opens the merma. */
export const tipoAlAbrir = (e: Existencia): TipoMovimiento =>
  e.existencias <= e.umbral ? 'Entrada' : 'Merma';

/** Digits only: the field wants a whole number. */
export const limpio = (raw: string): string => raw.replace(/[^0-9]/g, '');

const cantidadDe = (b: Borrador): number | null => cantidadValida(b.raw);

/** A merma within what there is; an entrada always fits. */
const alcanza = (b: Borrador, e: Existencia): boolean => {
  const n = cantidadDe(b);
  return b.tipo !== 'Merma' || n === null || n <= e.existencias;
};

export const listo = (b: Borrador, e: Existencia): boolean =>
  cantidadDe(b) !== null && alcanza(b, e) && (b.tipo !== 'Merma' || b.motivo !== null);

/** The stepper: one at least, never past the stock on a merma. */
export function paso(b: Borrador, e: Existencia, delta: number): string {
  const tope = b.tipo === 'Merma' ? Math.max(1, e.existencias) : Number.MAX_SAFE_INTEGER;
  const base = cantidadDe(b) ?? 0;
  return String(Math.min(tope, Math.max(1, base + delta)));
}

export interface Quedan {
  readonly texto: string;
  /** Green above the aviso, red when a merma doesn't fit, quiet otherwise. */
  readonly tono: 'bien' | 'rojo' | 'quieto';
}

/** «Vas a tener 30 kg», «Te van a quedar 2 kg, abajo del aviso», «Solo hay 6 kg.». */
export function quedan(b: Borrador, e: Existencia): Quedan {
  const n = cantidadDe(b);
  if (n === null) return { texto: '', tono: 'quieto' };
  if (!alcanza(b, e))
    return { texto: `Solo hay ${conUnidad(e.existencias, e.unidad)}.`, tono: 'rojo' };
  const merma = b.tipo === 'Merma';
  const despues = merma ? e.existencias - n : e.existencias + n;
  const bajo = despues <= e.umbral;
  const texto = `${merma ? 'Te van a quedar' : 'Vas a tener'} ${conUnidad(despues, e.unidad)}`;
  return bajo
    ? { texto: `${texto}, abajo del aviso`, tono: 'quieto' }
    : { texto, tono: merma ? 'quieto' : 'bien' };
}

/** «Registrar entrada de 24 kg»; the move alone until the quantity counts. */
export function cta(b: Borrador, e: Existencia): string {
  const n = cantidadDe(b);
  const que = `Registrar ${b.tipo === 'Merma' ? 'merma' : 'entrada'}`;
  return n === null ? que : `${que} de ${conUnidad(n, e.unidad)}`;
}

/** The write, or null while the sheet is not ready. */
export function payload(b: Borrador, e: Existencia): NuevoMovimientoVivo | null {
  const n = cantidadDe(b);
  if (n === null || !listo(b, e)) return null;
  return {
    tipo: b.tipo,
    existenciaId: e.id,
    cantidad: n,
    detalle: b.tipo === 'Merma' ? (b.motivo ?? '') : '',
  };
}
