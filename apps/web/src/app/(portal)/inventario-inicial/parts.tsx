'use client';

import { useState, useTransition } from 'react';

import { Banner, Button, Input } from '@/components';
import { capturarInventarioInicial } from '@/server/actions/apertura';

import { GridInventario, type Fila } from './grid';
import { pageSubtitle, pageTitle } from '../productos/productos.css';

/**
 * «Captura tu inventario inicial» (N-17): one-time. The grid writes apertura
 * movements — excluded from the monthly limit, feeding the opening Balance's
 * inventory line. A second visit shows the done state, never a re-capture.
 */

export interface ProductoGrid {
  readonly id: string;
  readonly nombre: string;
  readonly costo: string;
}

export interface InventarioView {
  readonly mayWrite: boolean;
  readonly yaCapturado: boolean;
  readonly hoy: string;
  readonly productos: readonly ProductoGrid[];
}

const pesos = (v: string): bigint => {
  const parts = v.split('.');
  const whole = parts[0] === '' ? '0' : parts[0];
  const cents = (parts[1] ?? '0').padEnd(2, '0').slice(0, 2);
  return BigInt(`${whole}${cents}`);
};

export function InventarioInicialScreen(view: InventarioView) {
  const [fecha, setFecha] = useState(view.hoy);
  const [filas, setFilas] = useState<Fila[]>(() => filasDe(view.productos));
  const [banner, setBanner] = useState<{ tone: 'success' | 'critical'; text: string } | null>(null);
  const [pendiente, start] = useTransition();

  // The capture's own revalidation re-renders this with `yaCapturado`, which
  // used to swap the screen before its «Capturado: …» banner was ever seen.
  if (view.yaCapturado) return <Capturado banner={banner} />;

  const validas = filas.filter((f) => f.cantidad.trim() !== '' && Number(f.cantidad) > 0);

  return (
    <>
      <EncabezadoInventario banner={banner} />
      <div style={{ width: 170, marginTop: 16 }}>
        <Input
          labelText="Fecha"
          value={fecha}
          disabled={!view.mayWrite}
          onChange={(e) => setFecha(e.target.value)}
          placeholder="2026-09-01"
        />
      </div>

      <GridInventario
        filas={filas}
        setFilas={setFilas}
        editable={view.mayWrite}
        porNombre={new Map(view.productos.map((p) => [p.nombre.trim().toLowerCase(), p.id]))}
        onBanner={(t, x) => setBanner({ tone: t, text: x })}
      />

      <BarraCaptura
        fecha={fecha}
        validas={validas}
        mayWrite={view.mayWrite}
        pendiente={pendiente}
        onCapturar={capturar(fecha, validas, start, setBanner)}
      />
    </>
  );
}

function EncabezadoInventario({
  banner,
}: {
  readonly banner: { tone: 'success' | 'critical'; text: string } | null;
}) {
  return (
    <>
      <h1 className={pageTitle}>Inventario inicial</h1>
      <p className={pageSubtitle}>
        Cuánto había de cada producto el día uno — una sola vez, sin contar al límite
      </p>
      {banner !== null ? <Banner tone={banner.tone} title={banner.text} /> : null}
    </>
  );
}

function Capturado({
  banner,
}: {
  readonly banner: { tone: 'success' | 'critical'; text: string } | null;
}) {
  return (
    <>
      <h1 className={pageTitle}>Inventario inicial</h1>
      <p className={pageSubtitle}>Ya está capturado</p>
      {banner !== null ? <Banner tone={banner.tone} title={banner.text} /> : null}
      <Banner
        tone="info"
        title="El inventario inicial ya se capturó. Ajusta existencias con un movimiento."
      />
    </>
  );
}

function capturar(
  fecha: string,
  validas: readonly Fila[],
  start: (fn: () => Promise<void>) => void,
  setBanner: (b: { tone: 'success' | 'critical'; text: string } | null) => void,
) {
  return () =>
    start(async () => {
      const r = await capturarInventarioInicial(
        fecha,
        validas.map((f) => ({
          productoId: f.productoId,
          cantidad: Math.trunc(Number(f.cantidad)),
          costo: f.costo,
        })),
      );
      setBanner(
        r.ok
          ? {
              tone: 'success',
              text: `Capturado: ${r.movimientos} productos, valuación $${r.total}.`,
            }
          : { tone: 'critical', text: r.message },
      );
    });
}

function BarraCaptura({
  validas,
  mayWrite,
  pendiente,
  onCapturar,
}: {
  readonly fecha: string;
  readonly validas: readonly Fila[];
  readonly mayWrite: boolean;
  readonly pendiente: boolean;
  readonly onCapturar: () => void;
}) {
  if (!mayWrite) return null;
  const valuacion = validas.reduce(
    (t, f) => t + pesos(f.costo) * BigInt(Math.trunc(Number(f.cantidad))),
    0n,
  );
  return (
    <div
      style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 20, flexWrap: 'wrap' }}
    >
      <Button variant="primary" disabled={pendiente || validas.length === 0} onClick={onCapturar}>
        {pendiente ? 'Capturando…' : `Capturar ${validas.length} productos`}
      </Button>
      <strong data-testid="valuacion-inicial">
        Valuación: ${(valuacion / 100n).toLocaleString('es-MX')}.
        {(valuacion % 100n).toString().padStart(2, '0')}
      </strong>
    </div>
  );
}

function filasDe(productos: readonly { id: string; nombre: string; costo: string }[]): Fila[] {
  return productos.map((p) => ({
    productoId: p.id,
    nombre: p.nombre,
    cantidad: '',
    costo: p.costo,
  }));
}
