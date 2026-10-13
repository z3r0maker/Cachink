/**
 * The movement sheet's form state (M-09, the board's dialog rules): the
 * product is picked from the catalogue, the quantity is a whole number
 * above zero (`cantidadValida`), and a merma always says what happened —
 * an entrada may say who brought it. The payload is the screen's
 * `NuevoMovimientoVivo`; the write behind it is the route's.
 */
import { useState } from 'react';
import {
  cantidadValida,
  type Existencia,
  type MotivoMerma,
  type NuevoMovimientoVivo,
  type TipoMovimiento,
} from '@xangarro/caja/inventario';
import { matches } from '@xangarro/caja';

/** Digits and one dot at most; the form wants an integer. */
const limpio = (raw: string): string => raw.replace(/[^0-9.]/g, '');

/** The sheet is complete: a product, a whole quantity, and a merma's reason. */
const completo = (
  tipo: 'Entrada' | 'Merma',
  producto: unknown,
  cantidad: number | null,
  motivo: unknown,
): boolean => producto !== null && cantidad !== null && (tipo !== 'Merma' || motivo !== null);

/** What the write says: what happened for a merma, who brought an entrada. */
const detalleDe = (
  tipo: 'Entrada' | 'Merma',
  motivo: MotivoMerma | null,
  proveedor: string,
): string => (tipo === 'Merma' ? (motivo ?? '') : proveedor.trim());

interface Formas {
  readonly tipo: TipoMovimiento;
  readonly producto: Existencia | null;
  readonly cantidad: number | null;
  readonly motivo: MotivoMerma | null;
  readonly proveedor: string;
  readonly listo: boolean;
}

/** The sheet's write, or null while it is incomplete. */
const payloadDe = (f: Formas): NuevoMovimientoVivo | null => {
  if (!f.listo || f.producto === null || f.cantidad === null) return null;
  return {
    tipo: f.tipo,
    existenciaId: f.producto.id,
    cantidad: f.cantidad,
    detalle: detalleDe(f.tipo, f.motivo, f.proveedor),
  };
};

export function useMoverForm(
  tipo: TipoMovimiento,
  items: readonly Existencia[],
  preselect: string | null,
) {
  const [productoId, setProductoId] = useState(preselect);
  const [raw, setRawRaw] = useState('');
  const [motivo, setMotivo] = useState<MotivoMerma | null>(null);
  const [proveedor, setProveedor] = useState('');
  const [query, setQuery] = useState('');
  const cantidad = cantidadValida(raw);
  const producto = items.find((i) => i.id === productoId) ?? null;
  const opciones = items.filter((i) => matches(query, i.nombre));
  const listo = completo(tipo, producto, cantidad, motivo);
  return {
    tipo,
    productoId,
    setProductoId,
    query,
    setQuery,
    opciones,
    producto,
    raw,
    setRaw: (v: string) => setRawRaw(limpio(v)),
    cantidad,
    motivo,
    setMotivo,
    proveedor,
    setProveedor,
    listo,
    payload: () => payloadDe({ tipo, producto, cantidad, motivo, proveedor, listo }),
  };
}

export type MoverForm = ReturnType<typeof useMoverForm>;

export interface GuardarHoja<T> {
  readonly guardando: boolean;
  readonly error: boolean;
  readonly guardar: (x: T | null) => Promise<void>;
}

/** Save through the route's write: close on success, say so on failure. */
export function useGuardarHoja<T>(
  onGuardar: (x: T) => Promise<void>,
  onListo: () => void,
): GuardarHoja<T> {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(false);
  const guardar = async (x: T | null): Promise<void> => {
    if (x === null || guardando) return;
    setGuardando(true);
    setError(false);
    try {
      await onGuardar(x);
      onListo();
    } catch {
      setError(true);
    } finally {
      setGuardando(false);
    }
  };
  return { guardando, error, guardar };
}
