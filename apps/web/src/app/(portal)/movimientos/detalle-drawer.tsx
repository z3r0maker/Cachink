'use client';

import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Drawer } from '@/components';

import type { Row } from './parts';
import {
  detalleCifra,
  detalleHero,
  detalleLinea,
  detalleSello,
  fichaFila,
} from './movimientos.css';

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

/** One `label · value` line of the field list. */
function Ficha({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className={fichaFila}>
      <span>{label}</span>
      <strong>{value}</strong>
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
    <div style={{ marginTop: 18 }}>
      <div className={detalleLinea}>Lo que llevó</div>
      {hermanas.map((r) => (
        <div key={r.id} className={fichaFila}>
          <span>{r.concepto}</span>
          <strong>{formatMoney(r.amount)}</strong>
        </div>
      ))}
    </div>
  );
}

/**
 * Where the row came from. A movement the portal is showing has arrived by
 * definition — «Pendiente de sincronizar» is a queue on the phone that the
 * server cannot see — so this says which phone delivered it, or that it was
 * captured here.
 */
function Origen({ row }: { readonly row: Row }) {
  const desdeTelefono = row.dispositivo !== null;
  return (
    <div
      className={detalleSello}
      style={{ background: desdeTelefono ? colors.greenSoft : colors.gray100 }}
    >
      <strong>{desdeTelefono ? 'Sincronizado' : 'Capturado en el portal'}</strong>
      <p style={{ margin: '4px 0 0' }}>
        {desdeTelefono
          ? `Llegó desde ${row.dispositivo} y está guardado en tus números.`
          : 'Se registró desde esta pantalla, no desde un teléfono.'}
      </p>
    </div>
  );
}

function Acciones({ row }: { readonly row: Row }) {
  // Only a venta has a comprobante, and a cancelled one never receipts —
  // the route refuses it, so the portal does not offer it either.
  if (row.ticketId === null || row.cancelada) return null;
  return (
    <a
      className={detalleLinea}
      href={`/api/comprobantes/${row.ticketId}?formato=png`}
      target="_blank"
      rel="noreferrer"
      data-testid="compartir-comprobante"
    >
      Compartir comprobante →
    </a>
  );
}

/** The amount block: a 44px figure over its date stamp. */
function Monto({ row, venta }: { readonly row: Row; readonly venta: boolean }) {
  return (
    <div className={detalleHero} style={{ background: venta ? colors.yellow : colors.white }}>
      <div className={detalleCifra}>
        {venta ? '+' : '−'}
        {formatMoney(row.amount)}
      </div>
      <div>
        {row.fecha}
        {row.hora === '' ? '' : ` · ${row.hora}`}
      </div>
    </div>
  );
}

function Fichas({ row, venta }: { readonly row: Row; readonly venta: boolean }) {
  return (
    <div style={{ marginTop: 18 }}>
      <Ficha label={venta ? 'Método de pago' : 'Categoría'} value={row.clasificacion} />
      <Ficha label="Operador" value={row.operador ?? '—'} />
      <Ficha label="Dispositivo" value={row.dispositivo ?? '—'} />
      {row.folio === null ? null : <Ficha label="Folio" value={`V-${row.folio}`} />}
      <Ficha label="Turno" value={row.turno ?? 'Sin turno'} />
      {row.cancelada ? <Ficha label="Estado" value="Cancelada" /> : null}
    </div>
  );
}

export function DetalleMovimiento({ row, rows, onClose }: DetalleProps) {
  if (row === null) return null;
  const venta = row.kind === 'venta';
  return (
    <Drawer
      open
      onOpenChange={(abierto) => (abierto ? undefined : onClose())}
      heading={row.concepto}
      headerTone={venta ? colors.greenSoft : colors.redSoft}
      description={`Detalle de ${venta ? 'la venta' : 'el gasto'} ${row.concepto}`}
      actions={<Acciones row={row} />}
    >
      <Monto row={row} venta={venta} />
      <Fichas row={row} venta={venta} />
      <Renglones row={row} rows={rows} />
      <div style={{ marginTop: 18 }}>
        <Origen row={row} />
      </div>
    </Drawer>
  );
}
