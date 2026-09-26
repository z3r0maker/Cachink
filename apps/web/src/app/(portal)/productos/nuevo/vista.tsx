'use client';

import { formatMoney, type ProductColor } from '@xangarro/domain';
import { productTints } from '@xangarro/tokens';

import { DonDice, type DonPose } from '@/components';
import { ProductGlyph } from '@/components/product-glyph';
import { adivinaIcono } from '@/lib/adivina-icono';
import { marginPercent, pesosToCentavos } from '@/lib/money';

import type { Draft } from '../sheet/use-producto-form';
import * as s from './nuevo.css';
import type { Paso } from './pasos';

const TINTS = productTints satisfies Record<ProductColor, { hex: string; label: string }>;

/** Don's line for the step the owner is on, and the pose he says it in. */
function consejo(d: Draft, paso: Paso): { pose: DonPose; texto: string } {
  if (paso === 1) {
    return adivinaIcono(d.nombre) === 'package' && d.icono === null
      ? { pose: 'caminando', texto: 'Escribe cómo se llama y le busco un ícono que se le parezca.' }
      : {
          pose: 'caminando',
          texto: 'Por el nombre le puse ese ícono. Si no te gusta, escoge otro; no pasa nada.',
        };
  }
  if (paso === 2) {
    const m = marginPercent(d.costo, d.precio);
    if (m === null)
      return {
        pose: 'pensando',
        texto: 'Dime cuánto te cuesta y en cuánto lo vendes, y te digo cuánto ganas.',
      };
    if (m <= 0)
      return {
        pose: 'preocupado',
        texto: 'Si lo vendes abajo del costo, cada venta te cuesta. ¿Seguro?',
      };
    if (m >= 50)
      return { pose: 'celebrando', texto: '¡Buen margen! Con eso sí sale para la renta.' };
    return {
      pose: 'pensando',
      texto: 'Vas bien. Si tus costos suben, aquí mismo le ajustas el precio.',
    };
  }
  return {
    pose: 'senalando',
    texto: 'Con el aviso te marco en Pendientes antes de que se acabe. Ya no más «¡ya no hay!».',
  };
}

/** «Así se verá en la caja»: the tile as the phone draws it, beside two neighbours. */
function Tile({ d }: { readonly d: Draft }) {
  const precio = pesosToCentavos(d.precio);
  return (
    <div
      className={s.tile}
      style={{ background: TINTS[d.colorFondo].hex }}
      data-testid="producto-preview"
    >
      <span className={s.tileIcono} key={d.icono ?? adivinaIcono(d.nombre)}>
        <ProductGlyph icon={d.icono ?? adivinaIcono(d.nombre)} size={28} />
      </span>
      <span className={s.tileNombre}>{d.nombre.trim() || 'Tu producto'}</span>
      <span className={s.tilePrecio}>{precio === null ? '$—' : formatMoney(precio)}</span>
    </div>
  );
}

export function Vista({ draft, paso }: { readonly draft: Draft; readonly paso: Paso }) {
  const c = consejo(draft, paso);
  return (
    <aside className={s.lado} aria-label="Vista previa">
      <section className={s.caja}>
        <h2 className={s.cajaTitulo}>Así se verá en la caja</h2>
        <div className={s.cajaRejilla}>
          <Tile d={draft} />
          <span className={s.fantasma} aria-hidden="true" />
          <span className={s.fantasma} aria-hidden="true" />
        </div>
      </section>
      <DonDice pose={c.pose} size={130}>
        {c.texto}
      </DonDice>
    </aside>
  );
}
