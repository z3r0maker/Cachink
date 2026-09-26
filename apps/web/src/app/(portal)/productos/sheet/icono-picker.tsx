'use client';

import { ProductIconEnum, type ProductIcon } from '@xangarro/domain';
import { useState } from 'react';

import { ProductGlyph } from '@/components/product-glyph';
import { adivinaIcono, SUGERIDOS } from '@/lib/adivina-icono';

import * as s from './icono.css';

/** The icon in use, big, and why it is that one. */
function Actual(p: {
  readonly actual: ProductIcon;
  readonly sugerido: ProductIcon;
  readonly escogido: boolean;
}) {
  const por = p.escogido
    ? 'Tú lo escogiste.'
    : p.sugerido === 'package'
      ? 'No reconocí el nombre, le puse una cajita.'
      : 'Por el nombre, le puse este.';
  return (
    <div className={s.actual}>
      <span className={s.grande} key={p.actual} data-testid="producto-icono">
        <ProductGlyph icon={p.actual} size={32} />
      </span>
      <span className={s.nota}>
        <strong>{por}</strong>
        <span>Si no te late, escoge otro:</span>
      </span>
    </div>
  );
}

/**
 * The product's icon (ADR-107). No category tabs: the name already suggests
 * one, ten common ones sit one tap away, and «Ver todos» opens the rest.
 * `null` in the draft means «the one the name suggests».
 */
export function IconoPicker(props: {
  readonly nombre: string;
  readonly icono: ProductIcon | null;
  readonly onPick: (icono: ProductIcon | null) => void;
}) {
  const [todos, setTodos] = useState(false);
  const sugerido = adivinaIcono(props.nombre);
  const actual = props.icono ?? sugerido;
  const lista = todos ? ProductIconEnum.options : SUGERIDOS.map((x) => x.icon);
  const label = (icon: ProductIcon) => SUGERIDOS.find((x) => x.icon === icon)?.label ?? icon;
  return (
    <div className={s.bloque}>
      <Actual actual={actual} sugerido={sugerido} escogido={props.icono !== null} />
      <div className={s.rejilla} role="radiogroup" aria-label="Icono">
        {lista.map((icon) => (
          <button
            key={icon}
            type="button"
            role="radio"
            aria-checked={icon === actual}
            aria-label={label(icon)}
            className={s.opcion}
            onClick={() => props.onPick(icon === sugerido ? null : icon)}
          >
            <ProductGlyph icon={icon} />
          </button>
        ))}
      </div>
      <button type="button" className={s.verTodos} onClick={() => setTodos((t) => !t)}>
        {todos ? 'Ver menos' : `Ver los ${ProductIconEnum.options.length} íconos`}
      </button>
    </div>
  );
}
