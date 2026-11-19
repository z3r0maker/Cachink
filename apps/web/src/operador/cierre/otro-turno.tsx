'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { OPERADOR_BASE } from '@xangarro/caja';
import * as a from '../acceso/acceso.css';
import { Fondo } from '../acceso/fondo';
import { abrirTurno } from '../acceso/flujo';
import { readSesion } from '../runtime/session-store';

const NO_ABRIO = 'No pudimos abrir el turno. Intenta otra vez.';

/**
 * «Abrir otro turno» (OpCierreCorte, P-43; ADR-147): the fondo dialog over the
 * closed screen, the counted cash written in. The operator who just closed
 * opens the next turno without the NIP again, then lands on Inicio. A closed
 * turno never reopens.
 */
export function OtroTurno(p: {
  readonly open: boolean;
  readonly operador: string;
  readonly contado: bigint;
  readonly onCerrar: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  if (!p.open) return null;
  const entrar = (): void => router.push(OPERADOR_BASE);
  const abrir = (fondo: bigint): void => {
    const sesion = readSesion();
    // An unlinked browser shows the design fixtures: there is no turno to open.
    if (sesion === null) return entrar();
    setError(null);
    void abrirTurno(sesion.userId, sesion.nombre, fondo, entrar, () => setError(NO_ABRIO));
  };
  return (
    <Fondo
      operador={p.operador}
      otro={{ contado: p.contado }}
      onAbierto={abrir}
      onCancelar={p.onCerrar}
      pie={
        error === null ? null : (
          <p className={a.fallo} role="alert">
            {error}
          </p>
        )
      }
    />
  );
}
