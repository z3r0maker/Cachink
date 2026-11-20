'use client';

import { useEffect, useState } from 'react';
import type { OperadorShellData } from '@xangarro/caja';

import { initials } from '../../shell/initials';
import { registerRuntime } from '../runtime/client';
import { readDevice } from '../runtime/device-store';
import { readSesion } from '../runtime/session-store';

/** What the shell names: whose register, who stands at it, since when. */
export type Quien = Pick<OperadorShellData, 'negocio' | 'operador' | 'turno'>;

const nombrado = (nombre: string) => ({ nombre, iniciales: initials(nombre) });

/** A linked caja's names, read from its own session and database. */
async function leer(nombre: string): Promise<Quien> {
  const device = readDevice();
  if (device === null) return { negocio: nombrado(''), operador: nombrado(nombre), turno: null };
  const runtime = registerRuntime();
  await runtime.boot();
  const { businessId, deviceId } = device;
  const [marca, abierto] = await Promise.all([
    runtime.negocio(businessId, deviceId),
    runtime.turnoAbierto(businessId, deviceId),
  ]);
  const turno =
    abierto === null
      ? null
      : { desde: (await runtime.ventas(businessId, deviceId, abierto.turnoId)).desde };
  return { negocio: nombrado(marca?.nombre ?? ''), operador: nombrado(nombre), turno };
}

/**
 * The shell's names (O-14): a linked caja shows the operator of its session,
 * its business as the register's database has it, and when the open turno
 * started; until they are read, blanks, never the design's Ana Robledo at
 * Taquería Don Pedro (CLAUDE.md §7). Read again on every route, since opening
 * and closing a turno each lead to another screen. An unlinked caja (the
 * design fixture) keeps what it was given, as the queue and the bell do.
 */
export function useQuien(fixture: Quien, pathname: string): Quien {
  const [linked] = useState(() => readDevice() !== null && readSesion() !== null);
  const [quien, setQuien] = useState<Quien>(() => ({
    negocio: nombrado(''),
    operador: nombrado(readSesion()?.nombre ?? ''),
    turno: null,
  }));
  useEffect(() => {
    if (!linked) return;
    let vivo = true;
    void leer(readSesion()?.nombre ?? '')
      .then((q) => {
        if (vivo) setQuien(q);
      })
      .catch((e: unknown) => console.error('shell', e));
    return () => {
      vivo = false;
    };
  }, [linked, pathname]);
  return linked ? quien : fixture;
}
