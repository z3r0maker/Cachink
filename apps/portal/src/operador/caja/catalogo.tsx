'use client';

import { colors } from '@xangarro/tokens';
import { formatMoney } from '@xangarro/domain';

import { Icon } from '../../shell/icon';
import { OperadorEstado } from '../estado';
import { ICONS } from '../shell/nav';
import { Glyph } from '../ui/parts';
import { PRODUCT_ICONS } from '../ui/product-icons';
import * as t from '../ui/title.css';
import * as c from './catalogo.css';
import type { Categoria, Producto } from './types';
import type { Caja, Filtro } from './use-caja';

const TINT: Record<Categoria, string> = {
  Tacos: colors.redSoft,
  Guisados: colors.peachSoft,
  Bebidas: colors.blueSoft,
  Extras: colors.greenSoft,
};
const FILTROS: readonly Filtro[] = ['Todos', 'Tacos', 'Guisados', 'Bebidas', 'Extras'];
const SEARCH = 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM21 21l-4.3-4.3';
const PLUS = 'M12 5v14M5 12h14';

type State = 'happy' | 'loading' | 'empty' | 'error';

/** The catalogue half: title, accent-insensitive search, category chips, tiles. */
export function Catalogo(p: {
  readonly caja: Caja;
  readonly state: State;
  readonly onNuevo: () => void;
}) {
  return (
    <div className={c.left}>
      <div className={t.titleRow}>
        <h1 className={t.pageTitle}>Caja</h1>
        <span className={t.pageSub}>Toca lo que pidió el cliente</span>
      </div>
      <Buscador caja={p.caja} />
      <Chips caja={p.caja} />
      {p.state === 'happy' ? null : (
        <OperadorEstado
          mode={p.state}
          icon={ICONS.ventas}
          emptyTitle="Todavía no hay catálogo"
          emptyBody="Pedro tiene que dar de alta los productos con su precio. Mientras, puedes crear lo que vendas desde «No está en el catálogo»."
          errorTitle="No pudimos cargar el catálogo"
        />
      )}
      <Rejilla caja={p.caja} happy={p.state === 'happy'} onNuevo={p.onNuevo} />
    </div>
  );
}

/** Category chips, without counts (README). */
function Chips({ caja }: { readonly caja: Caja }) {
  return (
    <div className={c.chips}>
      {FILTROS.map((f) => (
        <button
          key={f}
          type="button"
          className={c.chip}
          aria-pressed={caja.filtro === f}
          onClick={() => caja.setFiltro(f)}
        >
          {f}
        </button>
      ))}
    </div>
  );
}

function Buscador({ caja }: { readonly caja: Caja }) {
  return (
    <div className={c.search}>
      <span style={{ color: colors.gray600, display: 'grid' }}>
        <Icon path={SEARCH} size={18} strokeWidth={2.4} />
      </span>
      <input
        type="search"
        aria-label="Buscar producto"
        placeholder="Buscar producto"
        className={c.searchInput}
        value={caja.query}
        onChange={(e) => caja.buscar(e.target.value)}
      />
    </div>
  );
}

/** The tiles, and always last: «No está en el catálogo». */
function Rejilla(p: {
  readonly caja: Caja;
  readonly happy: boolean;
  readonly onNuevo: () => void;
}) {
  return (
    <div className={c.grid}>
      {p.happy ? p.caja.productos.map((x) => <Tile key={x.id} p={x} caja={p.caja} />) : null}
      <button
        type="button"
        className={c.tile}
        style={{ background: colors.gray100 }}
        onClick={p.onNuevo}
      >
        <span className={c.tileIcon}>
          <Icon path={PLUS} size={22} strokeWidth={2.6} />
        </span>
        <span className={c.nuevo}>No está en el catálogo</span>
      </button>
    </div>
  );
}

/** Stock shows only when low (README); the yellow badge is the quantity in the ticket. */
function Tile({ p, caja }: { readonly p: Producto; readonly caja: Caja }) {
  const line = caja.lines.find((l) => l.productoId === p.id);
  return (
    <button
      type="button"
      className={c.tile}
      style={{ background: TINT[p.categoria] }}
      title={p.nombre}
      onClick={() => caja.add(p)}
    >
      <span className={c.tileIcon}>
        <Glyph paths={PRODUCT_ICONS[p.icono]} size={22} stroke={2.3} />
      </span>
      <span className={c.tileText}>
        <span className={c.tileName}>{p.nombre}</span>
        {p.existencias <= p.umbral ? <span className={c.low}>Quedan {p.existencias}</span> : null}
      </span>
      <span className={c.price}>{formatMoney(p.precio)}</span>
      {line ? <span className={c.qty}>{line.cantidad}</span> : null}
    </button>
  );
}
