'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { formatMoney } from '@xangarro/domain';

import { desbloquear, useCajaBloqueada, useTicketEnCurso } from './ticket-store';
import { registerRuntime } from '../runtime/client';
import { readDevice } from '../runtime/device-store';
import { readSesion, writeSesion, type SesionCaja } from '../runtime/session-store';
import * as m from '../ui/mostrador.css';
import * as b from './bloqueo.css';
import { Entrar, NipPad, teclaDe, useTeclado } from './bloqueo-nip';
import { Marco, Nota, Quien, QuienSigue, type Operador } from './bloqueo-partes';
import { contar, total } from '@xangarro/caja/caja';

/** The register's whole lock surface (O-13, OpBloqueo); rendered by the shell. */
export function BloqueoCaja(): ReactNode {
  const locked = useCajaBloqueada();
  if (!locked) return null;
  return <Dialogo />;
}

const primero = (nombre: string): string => nombre.split(' ')[0] ?? nombre;

/** Verify the NIP and, on success, hand the caja to whoever came in: the
 *  turno stays; the next tickets are theirs. */
function hacerEntrar(p: {
  readonly elegido: Operador;
  readonly nip: string;
  readonly sesion: SesionCaja;
  readonly setError: (v: boolean) => void;
  readonly setNip: (v: string) => void;
}): () => Promise<void> {
  return async () => {
    const device = readDevice();
    if (device === null || p.nip.length !== 4) return;
    const r = await registerRuntime().autenticar(
      device.businessId,
      device.deviceId,
      p.elegido.nombre,
      p.nip,
    );
    if (!r.success) {
      p.setError(true);
      p.setNip('');
      return;
    }
    writeSesion({ userId: p.elegido.id, nombre: p.elegido.nombre, turnoId: p.sesion.turnoId });
    desbloquear();
  };
}

function useOperadores(setError: (v: boolean) => void): readonly Operador[] {
  const [operadores, setOperadores] = useState<readonly Operador[]>([]);
  useEffect(() => {
    const device = readDevice();
    if (device === null) return;
    void registerRuntime()
      .boot()
      .then(() => registerRuntime().operadores(device.businessId, device.deviceId))
      .then(setOperadores)
      .catch(() => setError(true));
  }, [setError]);
  return operadores;
}

function Dialogo(): ReactNode {
  const sesion = readSesion();
  return sesion === null ? null : <Candado sesion={sesion} />;
}

/** The lock's state: who is coming in, their NIP, and whether it was refused. */
function useCandado(sesion: SesionCaja) {
  const [error, setError] = useState(false);
  const operadores = useOperadores(setError);
  const [elegido, setElegido] = useState<Operador>({ id: sesion.userId, nombre: sesion.nombre });
  const [cambiando, setCambiando] = useState(false);
  const [nip, setNip] = useState('');
  const entrar = hacerEntrar({ elegido, nip, sesion, setError, setNip });
  const onKey = teclaDe(setNip, nip, () => void entrar());
  useTeclado(onKey);
  const elegir = (o: Operador) => {
    setElegido(o);
    setNip('');
    setError(false);
  };
  return { error, operadores, elegido, elegir, cambiando, setCambiando, nip, entrar, onKey };
}

/** Whoever holds the turno unlocks with their NIP; «No soy …» lets someone else in. */
function Candado({ sesion }: { readonly sesion: SesionCaja }): ReactNode {
  const lines = useTicketEnCurso();
  const c = useCandado(sesion);
  const mismo = c.elegido.id === sesion.userId;
  const de = primero(sesion.nombre);
  return (
    <Marco>
      <Quien nombre={c.elegido.nombre} mismo={mismo} de={de} />
      <Nota de={de} piezas={contar(lines)} total={formatMoney(total(lines))} />
      {c.cambiando ? (
        <QuienSigue operadores={c.operadores} elegido={c.elegido.id} onElegir={c.elegir} />
      ) : null}
      <NipPad
        nip={c.nip}
        error={c.error}
        onKey={c.onKey}
        accion={
          <Entrar
            listo={c.nip.length === 4}
            label={mismo ? 'Desbloquear' : `Entrar como ${primero(c.elegido.nombre)}`}
            onEntrar={() => void c.entrar()}
          />
        }
      />
      <button type="button" className={b.enlace} onClick={() => c.setCambiando(!c.cambiando)}>
        {c.cambiando ? `Soy ${de}, volver` : `No soy ${de}, cambiar de persona`}
      </button>
      {c.cambiando ? (
        <a href="/operador/cierre" className={`${b.enlace} ${m.opcional}`}>
          Cerrar el turno de {de} en lugar de continuar
        </a>
      ) : null}
    </Marco>
  );
}
