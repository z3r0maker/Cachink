'use client';

import { formatMoney } from '@xangarro/domain';

import { Icon } from '../../shell/icon';
import { Glyph } from '../ui/parts';
import { PRODUCT_ICONS } from '../ui/product-icons';
import * as m from '../ui/mostrador.css';
import * as c from './catalogo.css';
import { TINT } from './categorias';
import { ICONOS_ELEGIBLES } from './nuevo-icono';
import * as n from './nuevo-dialogo.css';
import type { Categoria } from './types';
import type { Nuevo } from './nuevo';

const CATEGORIAS: readonly Categoria[] = ['Tacos', 'Guisados', 'Bebidas', 'Extras'];
const INFO = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 16v-4M12 8h.01';

function Numero({ n: x }: { readonly n: number }) {
  return (
    <span className={n.numero} aria-hidden="true">
      {x}
    </span>
  );
}

/** The three questions: name, price, type. */
export function Preguntas({ f }: { readonly f: Nuevo }) {
  return (
    <div className={n.preguntas}>
      <Nombre f={f} />
      <Precio f={f} />
      <Tipo f={f} />
    </div>
  );
}

function Nombre({ f }: { readonly f: Nuevo }) {
  return (
    <div className={n.pregunta}>
      <label htmlFor="np-nombre" className={n.label}>
        <Numero n={1} />
        ¿Cómo se llama?
      </label>
      <span className={`${m.campo} ${n.campoGrande}`}>
        <input
          id="np-nombre"
          type="text"
          className={`${m.campoInput} ${n.nombre}`}
          placeholder="Por ejemplo: Orden de tripa"
          value={f.nombre}
          onChange={(ev) => f.setNombre(ev.target.value)}
        />
      </span>
    </div>
  );
}

function Precio({ f }: { readonly f: Nuevo }) {
  return (
    <div className={n.pregunta}>
      <label htmlFor="np-precio" className={n.label}>
        <Numero n={2} />
        ¿En cuánto lo vendes?
      </label>
      <span className={`${m.campo} ${n.campoGrande} ${n.precioCampo}`}>
        <span className={n.peso}>$</span>
        <input
          id="np-precio"
          type="text"
          inputMode="decimal"
          className={`${m.campoInput} ${n.precio}`}
          placeholder="0.00"
          value={f.precio}
          onChange={(ev) => f.setPrecio(ev.target.value.replace(/[^0-9.]/g, ''))}
        />
      </span>
    </div>
  );
}

function Tipo({ f }: { readonly f: Nuevo }) {
  return (
    <fieldset className={n.fieldset}>
      <legend className={n.label}>
        <Numero n={3} />
        ¿De qué tipo es?
      </legend>
      <div role="radiogroup" aria-label="Tipo de producto" className={n.chips}>
        {CATEGORIAS.map((x) => (
          <button
            key={x}
            type="button"
            role="radio"
            aria-checked={f.cat === x}
            className={m.chip}
            onClick={() => f.setCat(x)}
          >
            {x}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** «Así se verá en la caja»: the tile it will make, and its icon (suggested, or picked). */
export function Muestra({ f }: { readonly f: Nuevo }) {
  return (
    <section aria-labelledby="np-muestra" className={n.muestra}>
      <h3 id="np-muestra" className={`${m.eyebrow} ${n.h3}`}>
        Así se verá en la caja
      </h3>
      <div className={c.tile} aria-hidden="true">
        <span className={c.tileIcon} style={{ background: TINT[f.cat] }}>
          <Glyph paths={PRODUCT_ICONS[f.icono]} size={24} stroke={2.3} />
        </span>
        <span className={c.tileText}>
          <span className={c.tileName}>{f.nombre.trim() || 'Tu producto'}</span>
          <span className={c.price}>{formatMoney(f.monto ?? 0n)}</span>
        </span>
      </div>
      <div className={n.nota}>
        <span>{f.iconoNota} ·</span>
        <button
          type="button"
          className={n.cambiar}
          aria-expanded={f.cambiar}
          onClick={() => f.setCambiar(!f.cambiar)}
        >
          Cambiar
        </button>
      </div>
      {f.cambiar ? <Iconos f={f} /> : null}
      <p className={n.info}>
        <Icon path={INFO} size={16} strokeWidth={2} />
        Se vende desde ya. Pedro lo ve en su catálogo y le pone el costo.
      </p>
    </section>
  );
}

function Iconos({ f }: { readonly f: Nuevo }) {
  return (
    <div role="radiogroup" aria-label="Escoge otro ícono" className={n.iconos}>
      {ICONOS_ELEGIBLES.map(([k, label]) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={f.icono === k}
          aria-label={label}
          className={n.icono}
          onClick={() => f.setElegido(k)}
        >
          <Glyph paths={PRODUCT_ICONS[k]} size={22} stroke={2.2} />
        </button>
      ))}
    </div>
  );
}
