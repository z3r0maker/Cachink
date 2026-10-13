/**
 * What Inventario keeps on screen: the tab, the search, the product whose
 * sheet is open (and the one a link asked to open, once it is in the list),
 * the toast after a move and the error of a move that didn't save.
 */
import { useState } from 'react';
import type { Pestana, TipoMovimiento } from '@xangarro/caja/inventario';
import type { ExistenciaMovil, InventarioLeido } from './inventario-registro';
import { avisoHecho, tipoAlAbrir, type Borrador } from './mover-logica';

export interface Abierto {
  readonly id: string;
  readonly tipo: TipoMovimiento;
}

export interface Pedido {
  readonly id: string;
  readonly tipo?: TipoMovimiento;
}

/** A product a link asked to open: its sheet opens once it is in the list. */
function usePedido(
  data: InventarioLeido,
  inicial: Pedido | null,
  abrir: (a: Abierto) => void,
): void {
  const [pedido, setPedido] = useState(inicial);
  const e = pedido ? data.existencias.find((x) => x.id === pedido.id) : undefined;
  if (pedido && e) {
    setPedido(null);
    abrir({ id: e.id, tipo: pedido.tipo ?? tipoAlAbrir(e) });
  }
}

function useFiltros(inicial: Pestana | undefined) {
  const [tab, setTab] = useState<Pestana>(inicial ?? 'existencias');
  const [q, setQ] = useState('');
  return { tab, setTab, q, setQ };
}

export function useInventarioVista(
  data: InventarioLeido,
  onRegistrar: (b: Borrador, e: ExistenciaMovil) => Promise<void>,
  inicial: { readonly tab?: Pestana; readonly abrir?: Pedido | null },
) {
  const [abierto, setAbierto] = useState<Abierto | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  usePedido(data, inicial.abrir ?? null, setAbierto);
  const registrar = (b: Borrador, x: ExistenciaMovil): void => {
    setError(null);
    onRegistrar(b, x).then(
      () => {
        setAbierto(null);
        setToast(avisoHecho(b, x));
      },
      () => setError('No se pudo guardar el movimiento. Vuelve a intentarlo.'),
    );
  };
  const cerrar = (): void => {
    setAbierto(null);
    setError(null);
  };
  const e = abierto ? (data.existencias.find((x) => x.id === abierto.id) ?? null) : null;
  return {
    ...useFiltros(inicial.tab),
    abierto,
    setAbierto,
    e,
    toast,
    setToast,
    error,
    registrar,
    cerrar,
  };
}
