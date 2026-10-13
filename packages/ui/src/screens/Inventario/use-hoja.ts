/**
 * The sheets' open state (M-09): which of the two movements is being
 * recorded and on which product — a row's quick square preselects one, the
 * top buttons open without — plus the «Para hoy» hand-off: a product
 * Inicio says to restock opens its «Llegó mercancía» once, as soon as the
 * read lists it (the web's `useReponer`).
 */
import { useEffect, useState } from 'react';
import type { Existencia, TipoMovimiento } from '@xangarro/caja/inventario';

export interface Hoja {
  readonly tipo: TipoMovimiento;
  readonly productoId: string | null;
}

export interface HojaVivo {
  readonly hoja: Hoja | null;
  readonly abrir: (tipo: TipoMovimiento, productoId: string | null) => void;
  readonly cerrar: () => void;
}

/** `?reponer=<id>` (Inicio's «Para hoy»): the entrada sheet opens on it once. */
function useReponer(
  reponer: string | null,
  items: readonly Existencia[],
  setHoja: (h: Hoja) => void,
): void {
  const [hecho, setHecho] = useState(false);
  useEffect(() => {
    if (hecho || reponer === null || !items.some((i) => i.id === reponer)) return;
    setHecho(true);
    setHoja({ tipo: 'Entrada', productoId: reponer });
  }, [hecho, reponer, items, setHoja]);
}

export function useHoja(reponer: string | null, items: readonly Existencia[]): HojaVivo {
  const [hoja, setHoja] = useState<Hoja | null>(null);
  useReponer(reponer, items, setHoja);
  return {
    hoja,
    abrir: (tipo, productoId) => setHoja({ tipo, productoId }),
    cerrar: () => setHoja(null),
  };
}
