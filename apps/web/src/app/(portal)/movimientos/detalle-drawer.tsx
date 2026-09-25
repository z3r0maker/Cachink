'use client';

import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Drawer, DrawerStatus } from '@/components';
import { button } from '@/components/button.css';

import * as s from './movimientos.css';
import type { Row } from './parts';

/**
 * The movement drawer (B-2). Rows were inert: the table was the whole screen,
 * and «Compartir comprobante» — a read-only action the design keeps for
 * **every** role — had nowhere to live in the portal at all.
 *
 * ADR-058 drops the design's second footer action, the danger «Cancelar»:
 * cancelling is the register's job, at the counter, with the customer there.
 */
export interface DetalleProps {
  readonly row: Row | null;
  /** Every row on screen, so a venta can show the rest of its own ticket. */
  readonly rows: readonly Row[];
  readonly onClose: () => void;
}

/** One tile: what it is, and its value. */
function Ficha({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className={s.ficha}>
      <span className={s.fichaLabel}>{label}</span>
      <span className={s.fichaValor}>{value}</span>
    </div>
  );
}

/**
 * The other lines of the same ticket. They are already on screen — the table
 * lists every sale line — so the drawer groups rather than asking again.
 */
function Renglones({ row, rows }: { readonly row: Row; readonly rows: readonly Row[] }) {
  if (row.ticketId === null) return null;
  const hermanas = rows.filter((r) => r.ticketId === row.ticketId);
  if (hermanas.length < 2) return null;
  return (
    <section>
      <h3 className={s.detalleLinea}>Lo que llevó</h3>
      {hermanas.map((r) => (
        <div key={r.id} className={s.renglon}>
          <span>{r.concepto}</span>
          <span>{formatMoney(r.amount)}</span>
        </div>
      ))}
    </section>
  );
}

/**
 * Where the row came from. A movement the portal is showing has arrived by
 * definition — «Pendiente de sincronizar» is a queue on the phone that the
 * server cannot see — so the pill says it arrived, or that it was captured here.
 */
function Estado({ row, venta }: { readonly row: Row; readonly venta: boolean }) {
  if (row.cancelada) return <DrawerStatus tone="warn">Cancelada</DrawerStatus>;
  if (row.dispositivo === null) return <DrawerStatus tone="neutral">Capturado aquí</DrawerStatus>;
  return <DrawerStatus>{venta ? 'Sincronizada' : 'Sincronizado'}</DrawerStatus>;
}

function Acciones({ row }: { readonly row: Row }) {
  // Only a venta has a comprobante, and a cancelled one never receipts —
  // the route refuses it, so the portal does not offer it either.
  if (row.ticketId === null || row.cancelada) return null;
  return (
    <a
      className={button({ variant: 'primary', full: true })}
      href={`/api/comprobantes/${row.ticketId}?formato=png`}
      target="_blank"
      rel="noreferrer"
      data-testid="compartir-comprobante"
    >
      Compartir comprobante
    </a>
  );
}

function Fichas({ row, venta }: { readonly row: Row; readonly venta: boolean }) {
  return (
    <div className={s.fichas}>
      <Ficha label={venta ? 'Cómo pagaron' : 'Categoría'} value={row.clasificacion} />
      <Ficha label={venta ? 'Quién cobró' : 'Quién lo anotó'} value={row.operador ?? '—'} />
      <Ficha label="En qué caja" value={row.dispositivo ?? 'En el portal'} />
      <Ficha label="Turno" value={row.turno ?? 'Sin turno'} />
    </div>
  );
}

function eyebrow(row: Row, venta: boolean): string {
  if (!venta) return 'Gasto';
  return row.folio === null ? 'Venta' : `Venta · folio V-${row.folio}`;
}

export function DetalleMovimiento({ row, rows, onClose }: DetalleProps) {
  if (row === null) return null;
  const venta = row.kind === 'venta';
  return (
    <Drawer
      open
      onOpenChange={(abierto) => (abierto ? undefined : onClose())}
      eyebrow={eyebrow(row, venta)}
      status={<Estado row={row} venta={venta} />}
      heading={row.concepto}
      subtitle={row.hora === '' ? row.fecha : `${row.fecha} · ${row.hora}`}
      description={`Detalle de ${venta ? 'la venta' : 'el gasto'} ${row.concepto}`}
      actions={<Acciones row={row} />}
    >
      <div
        className={s.detalleMonto}
        style={{
          background: venta ? colors.greenSoft : colors.redSoft,
          color: venta ? colors.greenText : colors.redText,
        }}
      >
        {venta ? '+' : '−'}
        {formatMoney(row.amount)}
      </div>
      <Fichas row={row} venta={venta} />
      <Renglones row={row} rows={rows} />
    </Drawer>
  );
}
