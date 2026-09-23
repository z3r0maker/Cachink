'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { colors, portalFontSizes } from '@xangarro/tokens';

import { desbloquear, useCajaBloqueada, useTicketEnCurso } from './ticket-store';
import * as a from '../acceso/acceso.css';
import { registerRuntime } from '../runtime/client';
import { readDevice } from '../runtime/device-store';
import { readSesion, writeSesion } from '../runtime/session-store';
import { contar } from './ticket';
import { NipPad, teclaDe } from './bloqueo-nip';

function iniciales(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

/** The register's whole lock surface (O-13); rendered by the shell. */
export function BloqueoCaja(): ReactNode {
  const locked = useCajaBloqueada();
  if (!locked) return null;
  return <Dialogo />;
}

/** The two notes the design spells: with and without a ticket in progress. */
function Nota({ nombre, count }: { readonly nombre: string; readonly count: number }): ReactNode {
  const de = nombre.split(' ')[0];
  return (
    <p className={a.body} data-testid="bloqueo-nota">
      {count > 0
        ? `El ticket de ${de} queda guardado con ${count} artículo${count === 1 ? '' : 's'}. Si entra alguien más, el ticket se mantiene y las ventas siguientes quedan a su nombre.`
        : `Nadie puede capturar hasta que alguien entre con su NIP. El turno de ${de} sigue abierto.`}
    </p>
  );
}

function QuienSigue(p: {
  readonly operadores: readonly { id: string; nombre: string }[];
  readonly elegido: string | undefined | null;
  readonly onElegir: (o: { id: string; nombre: string }) => void;
}): ReactNode {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {p.operadores.map((o) => (
        <button
          key={o.id}
          type="button"
          className={a.operadorRow}
          data-testid="bloqueo-operador"
          aria-pressed={p.elegido === o.id}
          onClick={() => p.onElegir(o)}
        >
          <span className={a.initials}>{iniciales(o.nombre)}</span>
          {o.nombre}
        </button>
      ))}
    </div>
  );
}

function Pie(p: {
  readonly listo: boolean;
  readonly mismo: boolean;
  readonly elegido: string | null;
  readonly deQuien: string;
  readonly onEntrar: () => void;
}): ReactNode {
  return (
    <>
      <button
        type="button"
        className={a.key}
        style={{ height: 52, background: p.listo ? colors.yellow : colors.gray100 }}
        disabled={!p.listo}
        data-testid="bloqueo-entrar"
        onClick={p.onEntrar}
      >
        {p.mismo
          ? 'Desbloquear caja'
          : p.elegido === null
            ? 'Entrar'
            : `Entrar como ${p.elegido.split(' ')[0]}`}
      </button>
      <a href="/operador/cierre" style={{ textAlign: 'center', fontSize: portalFontSizes.sm }}>
        Cerrar el turno de {p.deQuien} en lugar de continuar
      </a>
    </>
  );
}

/** Verify the NIP and, on success, hand the caja to whoever came in — the
 *  turno stays; the next tickets are theirs. */
function hacerEntrar(p: {
  readonly elegido: { id: string; nombre: string } | null;
  readonly nip: string;
  readonly sesion: { turnoId: string };
  readonly setError: (v: boolean) => void;
  readonly setNip: (v: string) => void;
}): () => Promise<void> {
  return async () => {
    const device = readDevice();
    if (device === null || p.elegido === null || p.nip.length !== 4) return;
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

function Dialogo(): ReactNode {
  const sesion = readSesion();
  const count = contar(useTicketEnCurso());
  const [operadores, setOperadores] = useState<readonly { id: string; nombre: string }[]>([]);
  const [elegido, setElegido] = useState<{ id: string; nombre: string } | null>(null);
  const [nip, setNip] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const device = readDevice();
    if (device === null) return;
    void registerRuntime()
      .boot()
      .then(() => registerRuntime().operadores(device.businessId, device.deviceId))
      .then(setOperadores)
      .catch(() => setError(true));
  }, []);

  if (sesion === null) return null;
  const entrar = hacerEntrar({ elegido, nip, sesion, setError, setNip });
  const mismo = elegido !== null && elegido.nombre === sesion.nombre;
  const onKey = teclaDe(setNip, nip, entrar);

  return (
    <Marco nota={<Nota nombre={sesion.nombre} count={count} />}>
      <QuienSigue operadores={operadores} elegido={elegido?.id} onElegir={setElegido} />
      {elegido === null ? null : <NipPad nip={nip} error={error} onKey={onKey} />}
      <Pie
        listo={elegido !== null && nip.length === 4}
        mismo={mismo}
        elegido={elegido?.nombre ?? null}
        deQuien={sesion.nombre.split(' ')[0] ?? ''}
        onEntrar={() => void entrar()}
      />
    </Marco>
  );
}

/** The scrim + card the design draws around the whole lock. */
function Marco(p: { readonly nota: ReactNode; readonly children: ReactNode }): ReactNode {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Caja bloqueada"
      data-testid="caja-bloqueada"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        overflowY: 'auto',
        background: colors.scrim,
      }}
    >
      {/* `minHeight` + inner grid instead of centering the card directly: a
       *  tall card (nota + picker + NIP + pie) must scroll into view, not
       *  overflow both edges of a short screen unreachable. */}
      <div
        style={{
          minHeight: '100%',
          display: 'grid',
          placeItems: 'center',
          padding: 16,
        }}
      >
        <div className={a.card} style={{ width: 'min(420px, 100%)', gap: 14 }}>
          <span className={a.paso}>Caja bloqueada · Caja 1</span>
          {p.nota}
          <h1 className={a.title} style={{ fontSize: portalFontSizes.cardTitle }}>
            Quién sigue en la caja
          </h1>
          {p.children}
        </div>
      </div>
    </div>
  );
}
