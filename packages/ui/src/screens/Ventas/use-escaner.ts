/**
 * The escáner's state across codes (MvEscaner, EcDuplicado, EcInventario):
 * each read goes through `estadoDeCodigo`. On the ticket a known code goes on
 * it with «Deshacer»; in Inventario it opens that product's movement
 * (`paraInventario`). A shared code waits for `elegir`, an unknown one offers
 * «Darlo de alta».
 */
import { useState } from 'react';
import { impactLight, notificationError, notificationSuccess } from '../../haptics/index';
import type { ProductoCobrar } from './cobrar-catalogo';
import {
  elegidoDeDuplicado,
  estadoDeCodigo,
  paraInventario,
  type EstadoEscaner,
} from './escaner-estado';

export type { EstadoEscaner } from './escaner-estado';

/** What a found product does: on the ticket (Cobrar) or one product's movement (Inventario). */
export type ModoEscaner =
  | {
      readonly tipo: 'ticket';
      readonly onAgregar: (p: ProductoCobrar) => void;
      readonly onQuitarUno: (p: ProductoCobrar) => void;
    }
  | {
      readonly tipo: 'producto';
      /** Whether Inventario lists the product (its stock is tracked). */
      readonly llevaExistencias: (p: ProductoCobrar) => boolean;
      readonly onProducto: (p: ProductoCobrar) => void;
    };

export interface UseEscaner {
  readonly estado: EstadoEscaner;
  readonly leer: (codigo: string) => void;
  /** A shared code: the product the operator tapped. */
  readonly elegir: (p: ProductoCobrar) => void;
  readonly deshacer: () => void;
  readonly otro: () => void;
  readonly reiniciar: () => void;
}

export function useEscaner(productos: readonly ProductoCobrar[], modo: ModoEscaner): UseEscaner {
  const [estado, setEstado] = useState<EstadoEscaner>({ tipo: 'listo' });
  const aplicar = (e: EstadoEscaner): void => {
    const r = modo.tipo === 'producto' ? paraInventario(e, modo.llevaExistencias) : e;
    if (r.tipo === 'abrir' && modo.tipo === 'producto') {
      notificationSuccess();
      setEstado({ tipo: 'listo' });
      modo.onProducto(r.p);
      return;
    }
    if (r.tipo === 'abrir') return;
    if (r.tipo === 'agregado' && modo.tipo === 'ticket') {
      notificationSuccess();
      modo.onAgregar(r.p);
    } else if (r.tipo !== 'duplicado') {
      notificationError();
    }
    setEstado(r);
  };
  const leer = (codigo: string): void => {
    const e = estadoDeCodigo(productos, codigo);
    if (e.tipo === 'duplicado') notificationError();
    aplicar(e);
  };
  const elegir = (p: ProductoCobrar): void => {
    if (estado.tipo === 'duplicado') aplicar(elegidoDeDuplicado(estado, p));
  };
  const deshacer = (): void => {
    if (estado.tipo !== 'agregado' || modo.tipo !== 'ticket') return;
    impactLight();
    modo.onQuitarUno(estado.p);
    setEstado({ tipo: 'deshecho', p: estado.p });
  };
  const otro = (): void => setEstado({ tipo: 'listo' });
  return { estado, leer, elegir, deshacer, otro, reiniciar: otro };
}
