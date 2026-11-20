'use client';

import { useState } from 'react';
import { formatMoney, toPesosString } from '@xangarro/domain';
import { fontSizes, typography } from '@xangarro/tokens';

import { parseRecibido } from '@xangarro/caja/caja';
import { ChoiceChips } from '@/operador/ui/choice';
import { eyebrow } from '@/styles/text.css';

import { Par, Revisar, type CampoDef } from './comun';
import { margen, semaforo } from './derive';
import * as s from './form.css';
import type { ProductoCaja } from './types';

const CATEGORIAS = ['Tacos', 'Guisados', 'Bebidas', 'Extras'] as const;
const dinero = (v: string) => v.replace(/[^0-9.]/g, '');
const entero = (v: string) => v.replace(/\D/g, '');

/** Price, **cost** with the live margin, category, stock and threshold; cost + category + stock approve. */
interface RevisarProductoProps {
  readonly x: ProductoCaja;
  readonly onClose: () => void;
  readonly onFusionar: () => void;
  /** «Son distintos» (P-45): the code comes off this product. */
  readonly onSonDistintos: () => void;
  readonly onAprobar: (f: {
    readonly precioCentavos: bigint;
    readonly costoCentavos: bigint;
    readonly categoria: string;
    readonly existencias: number;
    readonly umbral: number;
  }) => void;
}

export function RevisarProducto(p: RevisarProductoProps) {
  const f = useProducto(p.x);
  const aprobar = () => f.listo && p.onAprobar(camposDe(f, p.x.precio));
  return (
    <Revisar
      titulo={`Revisar ${p.x.nombre}`}
      capturado={capturado(p.x)}
      pareceA={p.x.pareceA}
      codigo={codigoRepetido(p.x, p.onSonDistintos)}
      cta="Aprobar y agregar al catálogo"
      listo={f.listo}
      onClose={p.onClose}
      onFusionar={p.onFusionar}
      onAprobar={aprobar}
    >
      <Par campos={f.precios} />
      <div className={s.fila} data-fuerte="" style={{ background: semaforo(f.m) }}>
        <span className={eyebrow}>Margen</span>
        <span
          className={s.figura}
          style={{ fontSize: fontSizes.xl4, letterSpacing: typography.letterSpacing.tight }}
        >
          {f.m === null ? '—' : `${f.m}%`}
        </span>
      </div>
      <ChoiceChips label="Categoría" options={CATEGORIAS} value={f.cat} onChange={f.setCat} />
      <Par campos={f.stock} />
    </Revisar>
  );
}

/** «Lo que capturó la caja»: name, price, the barcode when it has one, and the facts. */
const capturado = (x: ProductoCaja): string =>
  [
    `Nombre «${x.nombre}» y precio ${formatMoney(x.precio)}.`,
    x.codigo ? `Código de barras ${x.codigo}.` : null,
    x.detalle,
  ]
    .filter(Boolean)
    .join(' ');

/** The barcode match's box, when the match is by code (P-45). */
const codigoRepetido = (x: ProductoCaja, onSonDistintos: () => void) =>
  x.porCodigo && x.pareceA ? { con: x.pareceA, vendidas: x.vendidas, onSonDistintos } : undefined;

type Set = (v: string) => void;

/** A money field (price, cost) or a whole-number one (stock, threshold). */
const dineroDef = (
  id: string,
  label: string,
  value: string,
  set: Set,
  placeholder?: string,
): CampoDef => ({
  id,
  label,
  value,
  set: (v) => set(dinero(v)),
  className: s.dinero,
  inputMode: 'decimal',
  placeholder,
});

const enteroDef = (id: string, label: string, value: string, set: Set): CampoDef => ({
  id,
  label,
  value,
  set: (v) => set(entero(v)),
  className: s.numero,
  inputMode: 'numeric',
  placeholder: '0',
});

/** The approved fields, from the form's raw strings. */
function camposDe(
  f: ReturnType<typeof useProducto>,
  precio: ProductoCaja['precio'],
): Parameters<RevisarProductoProps['onAprobar']>[0] {
  return {
    precioCentavos: parseRecibido(f.precioRaw) ?? precio,
    costoCentavos: f.costo ?? 0n,
    categoria: f.cat ?? 'Extras',
    existencias: Number.parseInt(f.existenciasRaw || '0', 10),
    umbral: Number.parseInt(f.umbralRaw || '0', 10),
  };
}

function useProducto(x: ProductoCaja) {
  const [precio, setPrecio] = useState(toPesosString(x.precio).replace(/\.00$/, ''));
  const [costoRaw, setCosto] = useState('');
  const [cat, setCat] = useState<(typeof CATEGORIAS)[number] | null>(null);
  const [existencias, setExistencias] = useState('');
  const [umbral, setUmbral] = useState('');
  const costo = parseRecibido(costoRaw);
  const precios = [
    dineroDef('rv-precio', 'Precio de venta', precio, setPrecio),
    dineroDef('rv-costo', 'Costo', costoRaw, setCosto, '0.00'),
  ];
  const stock = [
    enteroDef('rv-exist', 'Existencias', existencias, setExistencias),
    enteroDef('rv-umbral', 'Umbral para reponer', umbral, setUmbral),
  ];
  const listo = cat !== null && costo !== null && costo > 0n && existencias !== '';
  return {
    precios,
    stock,
    costo,
    m: margen(parseRecibido(precio), costo),
    cat,
    setCat,
    listo,
    existenciasRaw: existencias,
    umbralRaw: umbral,
    precioRaw: precio,
  };
}
