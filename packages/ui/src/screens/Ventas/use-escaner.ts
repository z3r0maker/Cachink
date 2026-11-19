/**
 * The escáner's state across codes (MvEscaner, EcDuplicado): each read goes
 * through `estadoDeCodigo`; a known code goes on the ticket with «Deshacer»,
 * a shared one waits for `elegir`, an unknown one offers «Darlo de alta».
 */
import { useState } from 'react';
import { impactLight, notificationError, notificationSuccess } from '../../haptics/index';
import type { ProductoCobrar } from './cobrar-catalogo';
import { elegidoDeDuplicado, estadoDeCodigo, type EstadoEscaner } from './escaner-estado';

export type { EstadoEscaner } from './escaner-estado';

export interface UseEscaner {
  readonly estado: EstadoEscaner;
  readonly leer: (codigo: string) => void;
  /** A shared code: the product the operator tapped goes on the ticket. */
  readonly elegir: (p: ProductoCobrar) => void;
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
    const e = estadoDeCodigo(productos, codigo);
    if (e.tipo === 'agregado') {
      notificationSuccess();
      onAgregar(e.p);
    } else {
      notificationError();
    }
    setEstado(e);
  };
  const elegir = (p: ProductoCobrar): void => {
    if (estado.tipo !== 'duplicado') return;
    notificationSuccess();
    onAgregar(p);
    setEstado(elegidoDeDuplicado(estado, p));
  };
  const deshacer = (): void => {
    if (estado.tipo !== 'agregado') return;
    impactLight();
    onQuitarUno(estado.p);
    setEstado({ tipo: 'deshecho', p: estado.p });
  };
  const otro = (): void => setEstado({ tipo: 'listo' });
  return { estado, leer, elegir, deshacer, otro, reiniciar: otro };
}
