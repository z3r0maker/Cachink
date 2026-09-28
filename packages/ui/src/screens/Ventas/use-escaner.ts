/**
 * What the escáner shows after each code (MvEscaner): the product it added
 * (with «Deshacer»), a code the catalogue does not have (with «Darlo de
 * alta»), the undo done, or the hint to keep scanning.
 */
import { useState } from 'react';
import { impactLight, notificationError, notificationSuccess } from '../../haptics/index';
import { porCodigo, type ProductoCobrar } from './cobrar-catalogo';

export type EstadoEscaner =
  | { readonly tipo: 'listo' }
  | { readonly tipo: 'agregado'; readonly p: ProductoCobrar }
  | { readonly tipo: 'desconocido'; readonly codigo: string }
  | { readonly tipo: 'deshecho'; readonly p: ProductoCobrar };

export interface UseEscaner {
  readonly estado: EstadoEscaner;
  readonly leer: (codigo: string) => void;
  readonly deshacer: () => void;
  readonly otro: () => void;
  readonly reiniciar: () => void;
}

export function useEscaner(
  productos: readonly ProductoCobrar[],
  onAgregar: (p: ProductoCobrar) => void,
  onQuitarUno: (p: ProductoCobrar) => void,
): UseEscaner {
  const [estado, setEstado] = useState<EstadoEscaner>({ tipo: 'listo' });
  const leer = (codigo: string): void => {
    const p = porCodigo(productos, codigo);
    if (p === null) {
      notificationError();
      setEstado({ tipo: 'desconocido', codigo: codigo.trim() });
      return;
    }
    notificationSuccess();
    onAgregar(p);
    setEstado({ tipo: 'agregado', p });
  };
  const deshacer = (): void => {
    if (estado.tipo !== 'agregado') return;
    impactLight();
    onQuitarUno(estado.p);
    setEstado({ tipo: 'deshecho', p: estado.p });
  };
  const otro = (): void => setEstado({ tipo: 'listo' });
  return { estado, leer, deshacer, otro, reiniciar: otro };
}
