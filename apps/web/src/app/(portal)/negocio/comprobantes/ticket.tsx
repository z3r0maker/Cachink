'use client';

import { colors } from '@xangarro/tokens';

import { direccionVisible, fechaLarga, NO_FISCAL, VENTA, type Marca } from './muestra';
import * as t from './ticket.css';

/** Xangarro's mark (the X of the coin), as the caja's receipt draws it. */
const X =
  'M287 352 L414 331 L503 437 L597 310 L697 291 L576 508 L735 675 L584 693 L503 586 L432 701 L315 711 L436 513 Z';

/** The torn edge: 34 teeth across a 340-wide strip. */
const diente = (arriba: boolean) =>
  Array.from({ length: 35 }, (_, i) => `${i * 10},${(i % 2 === 0) === arriba ? 8 : 0}`).join(' ');
const ARRIBA = diente(true);
const ABAJO = diente(false);

function Fila(p: { readonly k: string; readonly v: string; readonly fuerte?: boolean }) {
  return (
    <div className={t.fila} data-fuerte={p.fuerte ? '' : undefined}>
      <span className={t.mayus}>{p.k}</span>
      <span aria-hidden="true" className={t.puntos} />
      <span>{p.v}</span>
    </div>
  );
}

function Banda({ m }: { readonly m: Marca }) {
  const dir = direccionVisible(m.form);
  return (
    <div className={t.banda}>
      <span className={t.logo}>
        {m.logoUrl ? <img src={m.logoUrl} alt="" className={t.logoImg} /> : m.iniciales}
      </span>
      <span className={t.nombreBloque}>
        <span className={t.negocio}>{m.nombre}</span>
        {dir ? <span className={t.direccion}>{dir}</span> : null}
      </span>
    </div>
  );
}

function Pie({ m }: { readonly m: Marca }) {
  const leyenda = m.form.receiptLeyenda.trim();
  const wa = m.form.whatsapp.trim();
  return (
    <div className={t.pie}>
      {leyenda ? <span className={t.leyenda}>{leyenda}</span> : null}
      {wa ? <span className={t.whatsapp}>WhatsApp {wa}</span> : null}
      <span className={t.fiscal}>{NO_FISCAL}</span>
    </div>
  );
}

function Filas({ m }: { readonly m: Marca }) {
  return (
    <div className={t.filas}>
      <Fila k="Venta" v={VENTA.folio} fuerte />
      <Fila k="Fecha" v={fechaLarga()} />
      <Fila k="Hora" v={VENTA.hora} />
      <div className={t.corte} />
      <Fila k={`${VENTA.cantidad} x ${VENTA.producto}`} v={VENTA.importe} fuerte />
      <span className={t.unidad}>{VENTA.unitario} c/u</span>
      <div className={t.corte} />
      <Fila k="Artículos" v={String(VENTA.cantidad)} />
      <div className={t.total}>
        <span className={t.totalLabel}>TOTAL MXN</span>
        <span className={t.totalValor}>{VENTA.total}</span>
      </div>
      <Fila k={VENTA.metodo} v={VENTA.recibido} />
      <Fila k="Cambio" v={VENTA.cambio} />
      <div className={t.corte} />
      <Pie m={m} />
      <div className={t.corte} />
      <span className={t.marca}>
        <span className={t.monedita}>
          <svg viewBox="281 271 460 460" width={7} height={7} aria-hidden="true">
            <path d={X} fill={colors.black} />
          </svg>
        </span>
        Hecho con Xangarro!
      </span>
    </div>
  );
}

/**
 * «Ticket», the default: the same paper the caja shares by WhatsApp, in
 * Xangarro's yellow, black and white whatever the brand colour.
 */
export function TicketPreview({ m }: { readonly m: Marca }) {
  return (
    <div
      role="img"
      aria-label={`Vista previa del ticket de la venta ${VENTA.folio} por ${VENTA.total}, pagado en efectivo`}
      className={t.papel}
    >
      <svg aria-hidden="true" viewBox="0 0 340 8" preserveAspectRatio="none" className={t.borde}>
        <polygon points={ARRIBA} />
      </svg>
      <div className={t.hoja}>
        <Banda m={m} />
        <Filas m={m} />
      </div>
      <svg aria-hidden="true" viewBox="0 0 340 8" preserveAspectRatio="none" className={t.borde}>
        <polygon points={ABAJO} />
      </svg>
    </div>
  );
}
