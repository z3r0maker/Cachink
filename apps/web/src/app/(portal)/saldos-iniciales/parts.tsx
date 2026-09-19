'use client';

import { useMemo, useState, useTransition } from 'react';

import {
  bloquearSaldosIniciales,
  guardarSaldosIniciales,
  type SaldosInicialesForm,
} from '@/server/actions/apertura';

import { LineasCxC, type Linea } from './lineas';
import { AccionesSaldos, CamposApertura, ConfirmarBloqueo, EncabezadoSaldos } from './campos';

/**
 * Saldos iniciales (N-17): fecha de apertura, caja, bancos and one saldo per
 * cliente. One save; one explicit, one-way lock (the typed confirm lives
 * here, the gate in the use case).
 */

export interface ClienteOpcion {
  readonly id: string;
  readonly nombre: string;
  readonly telefono: string | null;
}

export interface SaldosView {
  readonly mayWrite: boolean;
  readonly lockedAt: string | null;
  readonly form: SaldosInicialesForm;
  readonly clientes: readonly ClienteOpcion[];
}

function useSaldos(view: SaldosView) {
  const [fecha, setFecha] = useState(view.form.fechaApertura);
  const [caja, setCaja] = useState(view.form.caja);
  const [bancos, setBancos] = useState(view.form.bancos);
  const [lineas, setLineas] = useState<Linea[]>(() =>
    view.form.lines.map((l) => ({
      clienteId: l.clienteId,
      nombre: view.clientes.find((c) => c.id === l.clienteId)?.nombre ?? '—',
      saldo: l.saldo,
    })),
  );
  const [banner, setBanner] = useState<{ tone: 'success' | 'critical'; text: string } | null>(null);
  const [pending, start] = useTransition();

  const ok = (text: string) => setBanner({ tone: 'success', text });
  const mal = (text: string) => setBanner({ tone: 'critical', text });

  return {
    fecha,
    setFecha,
    caja,
    setCaja,
    bancos,
    setBancos,
    lineas,
    setLineas,
    banner,
    ok,
    mal,
    pending,
    guardar: guardarSaldos(start, { fecha, caja, bancos, lineas }, ok, mal),
    bloquear: bloquearSaldos(start, ok, mal),
  };
}

function guardarSaldos(
  start: (fn: () => Promise<void>) => void,
  form: { fecha: string; caja: string; bancos: string; lineas: readonly Linea[] },
  ok: (t: string) => void,
  mal: (t: string) => void,
) {
  return () =>
    start(async () => {
      const r = await guardarSaldosIniciales({
        fechaApertura: form.fecha,
        caja: form.caja,
        bancos: form.bancos,
        lines: form.lineas.map((l) => ({ clienteId: l.clienteId, saldo: l.saldo })),
      });
      if (r.ok) ok('Saldos guardados.');
      else mal(r.message);
    });
}

function bloquearSaldos(
  start: (fn: () => Promise<void>) => void,
  ok: (t: string) => void,
  mal: (t: string) => void,
) {
  return () =>
    start(async () => {
      const r = await bloquearSaldosIniciales();
      if (r.ok) ok('Saldos bloqueados.');
      else mal(r.message);
    });
}

export function SaldosScreen(view: SaldosView) {
  const f = useSaldos(view);
  const [confirmar, setConfirmar] = useState(false);
  const porNombre = useMemo(
    () => new Map(view.clientes.map((c) => [c.nombre.trim().toLowerCase(), c])),
    [view.clientes],
  );
  const editable = view.mayWrite && view.lockedAt === null;

  return (
    <>
      <EncabezadoSaldos banner={f.banner} lockedAt={view.lockedAt} />
      <CamposApertura f={f} editable={editable} />

      <LineasCxC
        lineas={f.lineas}
        setLineas={f.setLineas}
        editable={editable}
        porNombre={porNombre}
        onBanner={(t, x) => (t === 'success' ? f.ok(x) : f.mal(x))}
      />

      {editable ? (
        <AccionesSaldos
          pending={f.pending}
          onGuardar={f.guardar}
          onBloquear={() => setConfirmar(true)}
        />
      ) : null}

      {confirmar ? (
        <ConfirmarBloqueo onCerrar={() => setConfirmar(false)} onBloquear={f.bloquear} />
      ) : null}
    </>
  );
}
