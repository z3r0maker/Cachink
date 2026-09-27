'use client';

import { useState } from 'react';

import { Icon } from '../../shell/icon';
import { DialogoCerrar, DialogoMostrador, DialogoTitulo } from '../ui/dialogo-mostrador';
import type { ProductIcon } from '@xangarro/caja';
import * as m from '../ui/mostrador.css';
import { iconoPorNombre, parseRecibido, type Categoria, type Producto } from '@xangarro/caja/caja';
import * as n from './nuevo-dialogo.css';
import { Muestra, Preguntas } from './nuevo-partes';

const PLUS = 'M12 5v14M5 12h14';

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onAdd: (p: Producto) => void;
}

/**
 * «Producto nuevo en caja» (rule 4, OpProductoNuevo): three questions, a look
 * at the tile it will make, sold now and marked «creado en caja» for the
 * owner. It needs a name and a price to have something to sell.
 */
export function NuevoProducto({ open, onClose, onAdd }: Props) {
  const f = useNuevo(onAdd);
  return (
    <DialogoMostrador open={open} onClose={onClose} width={840}>
      <div className={n.cabeza}>
        <span className={n.titulos}>
          <span className={`${m.eyebrow} ${n.eyebrow}`}>3 preguntas y a vender</span>
          <DialogoTitulo className={n.titulo}>Producto nuevo en caja</DialogoTitulo>
        </span>
        <span className={n.cerrar}>
          <DialogoCerrar label="Cerrar sin agregar" fuerte />
        </span>
      </div>
      <div className={n.cuerpo}>
        <Preguntas f={f} />
        <Muestra f={f} />
      </div>
      <div className={n.pie}>
        <button type="button" className={m.boton.quieto} onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className={`${m.boton.primario} ${n.agregar}`}
          disabled={!f.ok}
          onClick={f.add}
        >
          <Icon path={PLUS} size={18} strokeWidth={2.6} />
          Agregar y ponerlo en el ticket
        </button>
      </div>
    </DialogoMostrador>
  );
}

export type Nuevo = ReturnType<typeof useNuevo>;

function useNuevo(onAdd: (p: Producto) => void) {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [cat, setCat] = useState<Categoria>('Guisados');
  const [elegido, setElegido] = useState<ProductIcon | null>(null);
  const [cambiar, setCambiar] = useState(false);
  const monto = parseRecibido(precio);
  const ok = nombre.trim() !== '' && monto !== null && monto > 0n;
  const sugerido = iconoPorNombre(nombre);
  const icono = elegido ?? sugerido;
  const add = () => {
    if (!ok || monto === null) return;
    onAdd({
      id: `caja-${Date.now()}`,
      nombre: nombre.trim(),
      precio: monto,
      categoria: cat,
      existencias: 0,
      umbral: 0,
      icono,
    });
    setNombre('');
    setPrecio('');
    setElegido(null);
    setCambiar(false);
  };
  const iconoNota = elegido
    ? 'Ícono escogido por ti'
    : sugerido === 'utensils'
      ? 'Ícono general, no reconocí el nombre'
      : 'Ícono sugerido por el nombre';
  return {
    ...{ nombre, precio, cat, icono, cambiar, monto, ok, iconoNota },
    setNombre: (v: string) => {
      setNombre(v);
      setElegido(null);
    },
    ...{ setPrecio, setCat, setElegido, setCambiar, add },
  };
}
