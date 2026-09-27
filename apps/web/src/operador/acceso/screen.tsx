'use client';

import { useState, type ReactNode } from 'react';

import { Fondo } from './fondo';
import { abrirTurno, useReentrada, vincularYPasar } from './flujo';
import { Marco } from './marco';
import { Nip } from './nip';
import { Vincular, type Vinculo } from './vincular';
import * as a from './acceso.css';
import { registerRuntime } from '../runtime/client';
import { readDevice } from '../runtime/device-store';
import type { OperadorPara } from '../runtime/protocol';

/** The caja's name on the door; the register has one caja per device. */
const CAJA = 'Caja 1';

type Paso =
  | { readonly etapa: 'vincular' }
  | { readonly etapa: 'nip' }
  | { readonly etapa: 'fondo'; readonly userId: string; readonly nombre: string };

function ErrorAcceso(p: { readonly error: string | null }): ReactNode {
  return p.error === null ? null : (
    <p className={a.fallo} role="alert" data-testid="acceso-error">
      {p.error}
    </p>
  );
}

function verificar(nombre: string, nip: string): Promise<{ success: boolean }> {
  const device = readDevice();
  if (device === null) return Promise.resolve({ success: false });
  return registerRuntime().autenticar(device.businessId, device.deviceId, nombre, nip);
}

function PasoNip(p: {
  readonly operadores: readonly OperadorPara[];
  readonly onFondo: (userId: string, nombre: string) => void;
  readonly pie: ReactNode;
}): ReactNode {
  return (
    <Nip
      operadores={p.operadores}
      caja={CAJA}
      pie={p.pie}
      verificar={verificar}
      onAutenticado={(userId) => {
        const nombre = p.operadores.find((o) => o.id === userId)?.nombre ?? '';
        p.onFondo(userId, nombre);
      }}
    />
  );
}

/**
 * Operador · Acceso (O-12): the register's door. Vincular links the browser as
 * a device (the bootstrap becomes its database), the NIP picks who stands at
 * the counter, and the fondo opens the turno: without it, nothing sells.
 */
export function AccesoScreen(p: { readonly onListo: () => void }) {
  // A linked browser (after a cierre or the lock) comes back at the NIP.
  const [paso, setPaso] = useState<Paso>(() =>
    readDevice() === null ? { etapa: 'vincular' } : { etapa: 'nip' },
  );
  const [error, setError] = useState<string | null>(null);
  const reentrada = useReentrada(p.onListo);
  const pie = <ErrorAcceso error={error ?? reentrada.error} />;

  const onVinculado = (r: Vinculo): Promise<void> =>
    vincularYPasar(r, reentrada.setOperadores)
      .then(() => setPaso({ etapa: 'nip' }))
      .catch((e: unknown) => setError(String(e)));

  if (paso.etapa === 'vincular') {
    return <Vincular onVinculado={(r) => void onVinculado(r)} pie={pie} />;
  }
  if (paso.etapa === 'nip') {
    return (
      <PasoNip
        operadores={reentrada.operadores}
        pie={pie}
        onFondo={(userId, nombre) => setPaso({ etapa: 'fondo', userId, nombre })}
      />
    );
  }
  return (
    <Marco pose={null} mensaje={null} chip={CAJA} chipSub="conectada" vinculada>
      <Fondo
        operador={paso.nombre}
        pie={pie}
        onCancelar={() => setPaso({ etapa: 'nip' })}
        onAbierto={(fondo) => void abrirTurno(paso.userId, paso.nombre, fondo, p.onListo, setError)}
      />
    </Marco>
  );
}
