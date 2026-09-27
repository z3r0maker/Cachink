'use client';

import { useState, useTransition } from 'react';

import {
  bloquearSaldosIniciales,
  guardarSaldosIniciales,
  type SaldosInicialesForm,
  type SaldosResult,
} from '@/server/actions/apertura';

import { centavosDe, sinComas } from '../_primeros/formato';
import type { Linea } from './lineas';

export interface ClienteOpcion {
  readonly id: string;
  readonly nombre: string;
  readonly telefono: string | null;
}

export interface SaldosView {
  readonly mayWrite: boolean;
  readonly lockedAt: string | null;
  readonly hoy: string;
  readonly form: SaldosInicialesForm;
  readonly clientes: readonly ClienteOpcion[];
}

/** The last save or lock: a pill beside the heading when it went well, an alert when not. */
export type Resultado =
  | { readonly ok: true; readonly texto: string }
  | { readonly ok: false; readonly texto: string };

let nuevas = 0;

export function lineaDe(c: ClienteOpcion | undefined, clienteId: string, saldo: string): Linea {
  return {
    clave: clienteId === '' ? `nueva-${++nuevas}` : clienteId,
    clienteId,
    nombre: c?.nombre ?? '',
    telefono: c?.telefono ?? '',
    saldo,
  };
}

/** One save; one explicit, one-way lock (the typed confirm lives in the screen, the gate in the use case). */
export function useSaldos(view: SaldosView) {
  const [fecha, setFecha] = useState(view.form.fechaApertura);
  const [caja, setCaja] = useState(view.form.caja);
  const [bancos, setBancos] = useState(view.form.bancos);
  const [lineas, setLineas] = useState<Linea[]>(() =>
    view.form.lines.map((l) =>
      lineaDe(
        view.clientes.find((c) => c.id === l.clienteId),
        l.clienteId,
        l.saldo,
      ),
    ),
  );
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [pending, start] = useTransition();

  const correr = (fn: () => Promise<SaldosResult>, bien: string) =>
    start(async () => {
      const r = await fn();
      setResultado(r.ok ? { ok: true, texto: bien } : { ok: false, texto: r.message });
    });
  const guardar = () =>
    correr(() => guardarSaldosIniciales(formaDe(fecha, caja, bancos, lineas)), 'Saldos guardados');
  const bloquear = () => correr(() => bloquearSaldosIniciales(), 'Saldos bloqueados');
  const cxc = lineas
    .filter((l) => l.clienteId !== '')
    .reduce((t, l) => t + centavosDe(sinComas(l.saldo)), 0n);
  const totales = { caja: centavosDe(sinComas(caja)), bancos: centavosDe(sinComas(bancos)), cxc };
  return {
    ...{ fecha, setFecha, caja, setCaja, bancos, setBancos, lineas, setLineas },
    ...{ resultado, pending, guardar, bloquear, totales },
  };
}

function formaDe(
  fecha: string,
  caja: string,
  bancos: string,
  lineas: readonly Linea[],
): SaldosInicialesForm {
  return {
    fechaApertura: fecha,
    caja: sinComas(caja),
    bancos: sinComas(bancos),
    lines: lineas
      .filter((l) => l.clienteId !== '')
      .map((l) => ({ clienteId: l.clienteId, saldo: sinComas(l.saldo) })),
  };
}

export type Saldos = ReturnType<typeof useSaldos>;
