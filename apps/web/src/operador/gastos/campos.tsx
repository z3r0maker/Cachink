import * as d from './drawer.css';
import type { FormGasto } from './registrar';
import { CATEGORIAS } from '@xangarro/caja/gastos';

/** Digits and one decimal point only; the form parses to centavos. */
const limpio = (raw: string) => raw.replace(/[^0-9.]/g, '');

/** ¿Qué compraste?, ¿Cuánto?, Categoría, ¿A quién le pagaste? */
export function Campos({ x }: { readonly x: FormGasto }) {
  return (
    <>
      <div className={d.campo}>
        <label htmlFor="rg-que" className={d.label}>
          ¿Qué compraste?
        </label>
        <input
          id="rg-que"
          type="text"
          className={d.input}
          placeholder="Cilindro de gas"
          value={x.concepto}
          onChange={(e) => x.setConcepto(e.target.value)}
        />
      </div>
      <Monto x={x} />
      <Categorias x={x} />
      <div className={d.campo}>
        <label htmlFor="rg-quien" className={d.label}>
          ¿A quién le pagaste? <span className={d.opcional}>(opcional)</span>
        </label>
        <input
          id="rg-quien"
          type="text"
          className={d.input}
          placeholder="La tienda, el gasero, el taxista"
          value={x.quien}
          onChange={(e) => x.setQuien(e.target.value)}
        />
      </div>
    </>
  );
}

function Categorias({ x }: { readonly x: FormGasto }) {
  return (
    <div className={d.campo} role="group" aria-labelledby="rg-cat">
      <span id="rg-cat" className={d.label}>
        Categoría
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {CATEGORIAS.map((c) => (
          <button
            key={c}
            type="button"
            className={d.cat}
            aria-pressed={x.categoria === c}
            onClick={() => x.setCategoria(c)}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function Monto({ x }: { readonly x: FormGasto }) {
  return (
    <div className={d.campo}>
      <label htmlFor="rg-monto" className={d.label}>
        ¿Cuánto?
      </label>
      <div className={d.dinero}>
        <span className={d.peso}>$</span>
        <input
          id="rg-monto"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className={d.montoInput}
          placeholder="0.00"
          value={x.raw}
          onChange={(e) => x.setRaw(limpio(e.target.value))}
        />
      </div>
    </div>
  );
}
