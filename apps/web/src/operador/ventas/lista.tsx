'use client';

import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { METODO_TONO } from './metodo';
import type { MetodoVenta, VentaTurno } from './types';
import * as l from './lista.css';

/**
 * Fiado y abonos still tints its method chips with these (its abonos can be
 * old QR/CoDi ones, read back only).
 */
export const METODO_BG: Readonly<Record<MetodoVenta | 'QR / CoDi', string>> = {
  Efectivo: colors.greenSoft,
  Transferencia: colors.blueSoft,
  Tarjeta: colors.purpleSoft,
  'QR / CoDi': colors.peachSoft,
  Fiado: colors.warningSoft,
};

/** The turno's sales (OpVentas): each row opens its ticket in the side panel. */
export function ListaVentas(p: {
  readonly ventas: readonly VentaTurno[];
  readonly seleccionada: string | null;
  readonly onAbrir: (folio: string) => void;
}) {
  return (
    <section aria-label="Ventas" className={l.card}>
      <div className={l.head} aria-hidden="true">
        <span>Folio</span>
        <span>Qué se vendió</span>
        <span>Cómo pagó</span>
        <span>Hora</span>
        <span className={l.derecha}>Monto</span>
      </div>
      {p.ventas.map((x) => (
        <Fila
          key={x.folio}
          x={x}
          sel={p.seleccionada === x.folio}
          onAbrir={() => p.onAbrir(x.folio)}
        />
      ))}
      {p.ventas.length === 0 ? (
        <div className={l.vacio}>
          <span className={l.vacioTitulo}>No hay ventas con ese filtro</span>
          <span className={l.vacioTexto}>Prueba con otra forma de pago o borra la búsqueda.</span>
        </div>
      ) : null}
    </section>
  );
}

/** A cancelled sale stays: struck through and grey, with its red chip. */
function Fila(p: { readonly x: VentaTurno; readonly sel: boolean; readonly onAbrir: () => void }) {
  const { x } = p;
  const tono = METODO_TONO[x.metodo];
  const monto = formatMoney(x.monto);
  return (
    <button
      type="button"
      className={l.row}
      onClick={p.onAbrir}
      aria-label={`Ver venta ${x.folio}, ${monto}${x.cancelada ? ', cancelada' : ''}`}
      data-sel={p.sel ? '' : undefined}
      data-cancelada={x.cancelada ? '' : undefined}
      data-fiado={x.metodo === 'Fiado' ? '' : undefined}
    >
      <span className={l.folio}>{x.folio}</span>
      <span className={l.que}>{x.concepto}</span>
      <span className={l.pago}>
        <span
          className={l.chip}
          style={{ background: tono.bg, color: tono.fg, border: `2px solid ${tono.borde}` }}
        >
          {x.metodo}
        </span>
        {x.cliente ? <span className={l.cliente}>{x.cliente}</span> : null}
        {x.cancelada ? <span className={l.cancelada}>Cancelada</span> : null}
      </span>
      <span className={l.hora}>{x.hora}</span>
      <span className={l.monto}>{monto}</span>
    </button>
  );
}
