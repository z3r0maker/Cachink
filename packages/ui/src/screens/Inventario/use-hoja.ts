/**
 * The sheets' open state (M-09): which of the two movements is being
 * recorded and on which product (a row's quick square preselects one, the
 * top buttons open without), and whether the escáner sent it (M-20, «Del
 * escáner»). A product that is not listed yet opens its «Llegó mercancía»
 * once, as soon as the read lists it: the one Inicio's «Para hoy» says to
 * restock (the web's `useReponer`), or the one the escáner just gave de alta.
 */
import { useEffect, useState } from 'react';
import type { Existencia, TipoMovimiento } from '@xangarro/caja/inventario';

export interface Hoja {
  readonly tipo: TipoMovimiento;
  readonly productoId: string | null;
  /** Opened by the escáner: the sheet says «Del escáner». */
  readonly delEscaner?: boolean;
}

export interface HojaVivo {
  readonly hoja: Hoja | null;
  readonly abrir: (tipo: TipoMovimiento, productoId: string | null) => void;
  /** The escáner found the product: its «Llegó mercancía», marked «Del escáner». */
  readonly delEscaner: (productoId: string) => void;
  /** The escáner's new product: its entrada opens once the read lists it. */
  readonly esperar: (productoId: string) => void;
  readonly cerrar: () => void;
}

/** A product's entrada, opened once the read lists it. */
function useEnCuantoEste(
  items: readonly Existencia[],
  setHoja: (h: Hoja) => void,
): (h: Hoja) => void {
  const [espera, setEspera] = useState<Hoja | null>(null);
  useEffect(() => {
    if (espera === null || !items.some((i) => i.id === espera.productoId)) return;
    setEspera(null);
    setHoja(espera);
  }, [espera, items, setHoja]);
  return setEspera;
}

export function useHoja(reponer: string | null, items: readonly Existencia[]): HojaVivo {
  const [hoja, setHoja] = useState<Hoja | null>(null);
  const esperar = useEnCuantoEste(items, setHoja);
  const [reponerHecho, setReponerHecho] = useState(false);
  useEffect(() => {
    if (reponerHecho || reponer === null) return;
    setReponerHecho(true);
    esperar({ tipo: 'Entrada', productoId: reponer });
  }, [reponerHecho, reponer, esperar]);
  return {
    hoja,
    abrir: (tipo, productoId) => setHoja({ tipo, productoId }),
    delEscaner: (productoId) => setHoja({ tipo: 'Entrada', productoId, delEscaner: true }),
    esperar: (productoId) => esperar({ tipo: 'Entrada', productoId, delEscaner: true }),
    cerrar: () => setHoja(null),
  };
}
