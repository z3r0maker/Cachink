'use client';

import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { initials } from '../../shell/initials';
import {
  fechaLarga,
  HECHO_CON,
  horaDe,
  importeTexto,
  leyendaDe,
  NO_FISCAL,
  pagoFilas,
  piezas,
  type Comprobante,
} from './receipt';
import * as k from './share-marca.css';
import * as r from './share-recibo.css';

/** Xangarro's mark (the X of the coin), as the board draws it. */
const X =
  'M287 352 L414 331 L503 437 L597 310 L697 291 L576 508 L735 675 L584 693 L503 586 L432 701 L315 711 L436 513 Z';

/** The torn edge: 34 teeth across a 340-wide strip. */
const diente = (arriba: boolean) =>
  Array.from({ length: 35 }, (_, i) => `${i * 10},${(i % 2 === 0) === arriba ? 8 : 0}`).join(' ');
const DIENTES = diente(true);
const DIENTES_ABAJO = diente(false);

/** The receipt as the customer gets it (OpComprobante). */
export function Recibo({ c, cliente }: { readonly c: Comprobante; readonly cliente?: string }) {
  const total = formatMoney(c.venta.total);
  return (
    <div
      role="img"
      aria-label={`Ticket de la venta ${c.folio}: total ${total}, ${c.venta.metodo.toLowerCase()}`}
      className={r.papel}
    >
      <svg aria-hidden="true" viewBox="0 0 340 8" preserveAspectRatio="none" className={r.borde}>
        <polygon points={DIENTES} />
      </svg>
      <div className={r.hoja}>
        <Banda c={c} />
        <Cuerpo c={c} total={total} cliente={cliente} />
      </div>
      <svg aria-hidden="true" viewBox="0 0 340 8" preserveAspectRatio="none" className={r.borde}>
        <polygon points={DIENTES_ABAJO} />
      </svg>
    </div>
  );
}

function Cuerpo(p: { readonly c: Comprobante; readonly total: string; readonly cliente?: string }) {
  const { c } = p;
  return (
    <div className={r.filas}>
      <Fila k="Venta" v={c.folio} fuerte />
      <Fila k="Fecha" v={fechaLarga()} />
      <Fila k="Hora" v={`${horaDe(c)} h`} />
      {c.caja ? <Fila k="Caja" v={c.caja} /> : null}
      <div className={r.corte} />
      {c.venta.lines.map((l) => (
        <Linea key={l.productoId} l={l} />
      ))}
      <div className={r.corte} />
      <Fila k="Artículos" v={String(piezas(c))} />
      <div className={r.total}>
        <span className={r.totalLabel}>TOTAL MXN</span>
        <span className={r.totalValor}>{p.total}</span>
      </div>
      {pagoFilas(c, p.cliente).map(([k, v]) => (
        <Fila key={k} k={k} v={v} />
      ))}
      <div className={r.corte} />
      <Pie c={c} />
      <div className={r.corte} />
      <span className={`${r.centro} ${r.marca}`}>
        <span className={r.monedita}>
          <svg viewBox="281 271 460 460" width={7} height={7} aria-hidden="true">
            <path d={X} fill={colors.black} />
          </svg>
        </span>
        {HECHO_CON}
      </span>
    </div>
  );
}

/** The business on top: its logo (or initials) and, if the owner chose, its address. */
function Banda({ c }: { readonly c: Comprobante }) {
  const logo = c.marca?.logoUrl;
  return (
    <div className={r.banda}>
      <span className={k.logo}>
        {logo ? <img src={logo} alt="" className={k.logoImg} /> : initials(c.negocio)}
      </span>
      <span className={k.nombreBloque}>
        <span className={r.negocio}>{c.negocio}</span>
        {c.marca?.direccion ? <span className={k.direccion}>{c.marca.direccion}</span> : null}
      </span>
    </div>
  );
}

function Linea({ l }: { readonly l: Comprobante['venta']['lines'][number] }) {
  return (
    <>
      <Fila k={`${l.cantidad} x ${l.nombre}`} v={importeTexto(l)} fuerte />
      {l.cantidad > 1 && l.precio > 0n ? (
        <span className={k.unidad}>{formatMoney(l.precio)} c/u</span>
      ) : null}
    </>
  );
}

/** The owner's leyenda (or the thank-you), their WhatsApp, and the fiscal note. */
function Pie({ c }: { readonly c: Comprobante }) {
  return (
    <div className={k.pie}>
      <span className={k.leyenda}>{leyendaDe(c)}</span>
      {c.marca?.whatsapp ? <span className={k.whatsapp}>WhatsApp {c.marca.whatsapp}</span> : null}
      <span className={k.fiscal}>{NO_FISCAL}</span>
    </div>
  );
}

function Fila(p: { readonly k: string; readonly v: string; readonly fuerte?: boolean }) {
  return (
    <div className={r.fila} data-fuerte={p.fuerte ? '' : undefined}>
      <span className={r.mayus}>{p.k}</span>
      <span aria-hidden="true" className={r.puntos} />
      <span>{p.v}</span>
    </div>
  );
}
