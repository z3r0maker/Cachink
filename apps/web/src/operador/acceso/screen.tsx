'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { Fondo } from './fondo';
import { Nip } from './nip';
import { Vincular, type Vinculo } from './vincular';
import * as a from './acceso.css';
import { registerRuntime } from '../runtime/client';
import { readDevice, writeDevice } from '../runtime/device-store';
import { writeSesion } from '../runtime/session-store';
import type { OperadorPara } from '../runtime/protocol';

type Paso =
  | { readonly etapa: 'vincular' }
  | { readonly etapa: 'nip'; readonly negocio: string }
  | {
      readonly etapa: 'fondo';
      readonly negocio: string;
      readonly userId: string;
      readonly nombre: string;
    };

/** A linked register re-enters at the NIP step (or straight in: turno open). */
function useReentrada(onListo: () => void): {
  readonly operadores: readonly OperadorPara[];
  readonly setOperadores: (o: readonly OperadorPara[]) => void;
  readonly error: string | null;
} {
  const [operadores, setOperadores] = useState<readonly OperadorPara[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const device = readDevice();
    if (device === null) return;
    const runtime = registerRuntime();
    void (async () => {
      try {
        await runtime.boot();
        const sesion = await runtime.turnoAbierto(device.businessId, device.deviceId);
        if (sesion !== null) {
          onListo();
          return;
        }
        setOperadores(await runtime.operadores(device.businessId, device.deviceId));
      } catch (e) {
        setError(String(e));
      }
    })();
  }, [onListo]);
  return { operadores, setOperadores, error };
}

async function abrirTurno(
  userId: string,
  nombre: string,
  fondoCentavos: bigint,
  onListo: () => void,
  onError: (e: string) => void,
): Promise<void> {
  const device = readDevice();
  if (device === null) return;
  try {
    const { turnoId } = await registerRuntime().abrirCaja(
      device.businessId,
      device.deviceId,
      userId,
      fondoCentavos,
    );
    writeSesion({ userId, nombre, turnoId });
    onListo();
  } catch (e) {
    onError(String(e));
  }
}

/** Link, keep the credentials, load the picker, move to the NIP step. */
async function vincularYPasar(
  r: Vinculo,
  setOperadores: (o: readonly OperadorPara[]) => void,
): Promise<void> {
  const runtime = registerRuntime();
  await runtime.boot();
  await runtime.vincular(r.tables as Parameters<typeof runtime.vincular>[0], r.businessId);
  writeDevice({
    deviceToken: r.deviceToken,
    deviceId: r.deviceId,
    businessId: r.businessId,
    activatedAt: new Date().toISOString(),
  });
  setOperadores(await runtime.operadores(r.businessId, r.deviceId));
}

function ErrorAcceso(p: { readonly error: string | null }): ReactNode {
  return p.error === null ? null : (
    <p className={a.error} data-testid="acceso-error">
      {p.error}
    </p>
  );
}

function PasoNip(p: {
  readonly operadores: readonly OperadorPara[];
  readonly negocio: string;
  readonly onFondo: (userId: string, nombre: string) => void;
  readonly onCambiar: () => void;
}): ReactNode {
  return (
    <Nip
      operadores={p.operadores}
      negocio={p.negocio}
      onAutenticado={(userId) => {
        const nombre = p.operadores.find((o) => o.id === userId)?.nombre ?? '';
        p.onFondo(userId, nombre);
      }}
      onCambiarOperador={p.onCambiar}
      verificar={(nombre, nip) => {
        const device = readDevice();
        if (device === null) return Promise.resolve({ success: false });
        return registerRuntime().autenticar(device.businessId, device.deviceId, nombre, nip);
      }}
    />
  );
}

/**
 * Operador · Acceso (O-12): the register's gate. Vincular links the browser as
 * a device (the bootstrap becomes its database), the NIP picks who stands at
 * the counter, and the fondo opens the turno — without it, nothing sells.
 */
export function AccesoScreen(p: { readonly onListo: () => void }) {
  const [paso, setPaso] = useState<Paso>({ etapa: 'vincular' });
  const [cambios, setCambios] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const reentrada = useReentrada(p.onListo);
  const operadores = paso.etapa === 'vincular' ? [] : reentrada.operadores;

  const onVinculado = (r: Vinculo): Promise<void> =>
    vincularYPasar(r, reentrada.setOperadores)
      .then(() => setPaso({ etapa: 'nip', negocio: 'Caja 1' }))
      .catch((e: unknown) => setError(String(e)));

  return (
    <main className={a.page}>
      <div className={a.card} data-testid="acceso-card">
        {paso.etapa === 'vincular' ? (
          <Vincular onVinculado={(r) => void onVinculado(r)} />
        ) : paso.etapa === 'nip' ? (
          <PasoNip
            key={cambios}
            operadores={operadores}
            negocio={paso.negocio}
            onFondo={(userId, nombre) =>
              setPaso({ etapa: 'fondo', negocio: paso.negocio, userId, nombre })
            }
            onCambiar={() => setCambios((c) => c + 1)}
          />
        ) : (
          <Fondo
            operador={paso.nombre}
            negocio={paso.negocio}
            onAbierto={(fondo) =>
              void abrirTurno(paso.userId, paso.nombre, fondo, p.onListo, setError)
            }
          />
        )}
        <ErrorAcceso error={error ?? reentrada.error} />
      </div>
    </main>
  );
}
