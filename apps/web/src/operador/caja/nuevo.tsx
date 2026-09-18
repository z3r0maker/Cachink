'use client';

import { useState } from 'react';
import { colors, portalFontSizes } from '@xangarro/tokens';

import { OpModal } from '../ui/modal';
import { Note } from '../ui/note';
import * as e from './efectivo.css';
import * as n from './nuevo.css';
import { parseRecibido } from './ticket';
import type { Categoria, Producto } from './types';

const CATEGORIAS: readonly Categoria[] = ['Tacos', 'Guisados', 'Bebidas', 'Extras'];

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onAdd: (p: Producto) => void;
}

/**
 * «Producto nuevo en caja» (rule 4): name, price and category, sold now and
 * marked «creado en caja» for the owner. The design always enables «Agregar al
 * ticket»; code needs a name and a price to have something to sell.
 */
export function NuevoProducto({ open, onClose, onAdd }: Props) {
  const f = useNuevo(onAdd);
  return (
    <OpModal
      open={open}
      onClose={onClose}
      title="Producto nuevo en caja"
      titleSize={portalFontSizes.lg}
      width={460}
      headBg={colors.yellow}
    >
      <Campos f={f} />
      <Categorias cat={f.cat} setCat={f.setCat} />
      <Note bg={colors.yellowSoft} padding={14} textColor={colors.ink}>
        Se venderá ahora y quedará marcado <strong>creado en caja</strong>. Pedro lo revisa en
        Productos y le pone costo y existencias.
      </Note>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className={n.cancel} onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className={n.add} disabled={!f.ok} onClick={f.add} data-onyellow="">
          Agregar al ticket
        </button>
      </div>
    </OpModal>
  );
}

function useNuevo(onAdd: (p: Producto) => void) {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [cat, setCat] = useState<Categoria>('Guisados');
  const monto = parseRecibido(precio.replace('$', ''));
  const ok = nombre.trim() !== '' && monto !== null && monto > 0n;
  const add = () => {
    if (!ok || monto === null) return;
    onAdd({
      id: `caja-${Date.now()}`,
      nombre: nombre.trim(),
      precio: monto,
      categoria: cat,
      existencias: 0,
      umbral: 0,
      icono: 'utensils',
    });
    setNombre('');
    setPrecio('');
  };
  return { nombre, setNombre, precio, setPrecio, cat, setCat, ok, add };
}

function Campo({
  id,
  label,
  children,
}: {
  readonly id: string;
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={e.label}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Categorias({
  cat,
  setCat,
}: {
  readonly cat: Categoria;
  readonly setCat: (c: Categoria) => void;
}) {
  return (
    <div>
      <div className={e.label} style={{ marginBottom: 8 }}>
        Categoría
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {CATEGORIAS.map((c) => (
          <button
            key={c}
            type="button"
            className={n.cat}
            aria-pressed={cat === c}
            onClick={() => setCat(c)}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function Campos({ f }: { readonly f: ReturnType<typeof useNuevo> }) {
  return (
    <>
      <Campo id="np-nombre" label="Nombre">
        <input
          id="np-nombre"
          className={n.input}
          type="text"
          placeholder="Orden de tripa"
          value={f.nombre}
          onChange={(ev) => f.setNombre(ev.target.value)}
        />
      </Campo>
      <Campo id="np-precio" label="Precio">
        <input
          id="np-precio"
          className={n.price}
          type="text"
          inputMode="decimal"
          placeholder="$0.00"
          value={f.precio}
          onChange={(ev) => f.setPrecio(ev.target.value.replace(/[^0-9.$]/g, ''))}
        />
      </Campo>
    </>
  );
}
