'use client';

import { useState, type ReactNode } from 'react';
import { colors } from '@xangarro/tokens';
import { deviceHeaders } from '@xangarro/contracts';
import { AVISO_VINCULACION_VERSION } from '@xangarro/domain';

import * as a from './acceso.css';
import { AvisoVinculacion } from './aviso-vinculacion';

/**
 * Paso 1 · Vincula esta caja. The owner's correo accompanies the code — it is
 * /activate's second factor, exactly as the phone's activation (the design
 * file shows only the code; the amendment is noted in docs/plan/10-operador.md).
 */

export interface Vinculo {
  readonly deviceToken: string;
  readonly deviceId: string;
  readonly businessId: string;
  readonly tables: object;
}

/** Uppercased, spaces and hyphens ignored — as the amended design says. */
export function limpiarCodigo(raw: string): string {
  return raw.toUpperCase().replace(/[\s-]/g, '').slice(0, 8);
}

const MENSAJE = 'No se pudo vincular. Inténtalo de nuevo.';

/** The contract's refusal codes, as the person at the counter reads them. */
function rechazo(code: string | undefined): string | null {
  switch (code) {
    // One answer for a wrong code and a wrong email (SEC-DEV-01): the server no
    // longer says which, so the counter checks both. EMAIL_MISMATCH is an older
    // server's word for the same thing.
    case 'CODE_INVALID':
    case 'EMAIL_MISMATCH':
      return 'El correo o el código no coinciden. Revisa los dos o pide uno nuevo.';
    case 'CODE_EXPIRED':
      return 'El código expiró. Pide otro desde el portal.';
    case 'CODE_USED':
      return 'Ese código ya se usó. Pide otro desde el portal.';
    case 'RATE_LIMITED':
      return 'Demasiados intentos. Espera unos minutos.';
    default:
      return null;
  }
}

type Activacion =
  | { readonly ok: true; readonly vinculo: Vinculo }
  | { readonly ok: false; readonly mensaje: string };

/** The request the phone sends, with this browser's device identity. */
function peticion(email: string, codigo: string): Request {
  return new Request('/api/v1/activate', {
    method: 'POST',
    headers: deviceHeaders(),
    body: JSON.stringify({
      email,
      code: codigo,
      device: {
        name: 'Caja · web',
        platform: 'web',
        appVersion: '0.1.0',
        osVersion: navigator.platform || 'web',
      },
      avisoVersion: AVISO_VINCULACION_VERSION,
    }),
  });
}

/** POST /api/v1/activate as a browser device (ADR-071 §1). */
async function activar(email: string, codigo: string): Promise<Activacion> {
  try {
    const res = await fetch(peticion(email, codigo));
    const body: unknown = await res.json();
    if (!res.ok) {
      const env = body as { error?: { code?: string; message?: string } };
      return { ok: false, mensaje: rechazo(env.error?.code) ?? env.error?.message ?? MENSAJE };
    }
    return { ok: true, vinculo: vinculoDe(body) };
  } catch {
    return {
      ok: false,
      mensaje: 'Sin conexión con el portal. Revisa la red e inténtalo de nuevo.',
    };
  }
}

function vinculoDe(body: unknown): Vinculo {
  const data = body as {
    deviceToken: string;
    deviceId: string;
    bootstrap: { tables: { businesses: { id: string }[] } };
  };
  return {
    deviceToken: data.deviceToken,
    deviceId: data.deviceId,
    businessId: data.bootstrap.tables.businesses[0]?.id ?? '',
    tables: data.bootstrap.tables as object,
  };
}

function Campos(p: {
  readonly email: string;
  readonly codigo: string;
  readonly onEmail: (v: string) => void;
  readonly onCodigo: (v: string) => void;
}) {
  return (
    <>
      <label className={a.paso} htmlFor="vincular-correo">
        Correo del dueño
      </label>
      <input
        id="vincular-correo"
        type="email"
        autoComplete="off"
        className={a.code}
        style={{ letterSpacing: 'normal', fontFamily: 'inherit' }}
        placeholder="pedro@taqueria.mx"
        data-testid="vincular-correo"
        value={p.email}
        onChange={(e) => p.onEmail(e.target.value)}
      />
      <label className={a.paso} htmlFor="vincular-codigo">
        Código de vinculación
      </label>
      <input
        id="vincular-codigo"
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="off"
        className={a.code}
        placeholder="TD491K7R"
        data-testid="vincular-codigo"
        value={p.codigo}
        onChange={(e) => p.onCodigo(limpiarCodigo(e.target.value))}
      />
    </>
  );
}

function Intro(): ReactNode {
  return (
    <>
      <span className={a.paso}>Paso 1 de 2 · Vincula esta caja</span>
      <h1 className={a.title}>Vincula esta caja</h1>
      <p className={a.body}>
        Pedro genera un código en su portal, en Operadores y dispositivos. Escríbelo aquí una sola
        vez: este navegador queda como caja del negocio.
      </p>
    </>
  );
}

function Pie(p: {
  readonly error: string | null;
  readonly listo: boolean;
  readonly enviando: boolean;
  readonly onContinuar: () => void;
}): ReactNode {
  return (
    <>
      {p.error === null ? null : (
        <p className={a.error} data-testid="vincular-error">
          {p.error}
        </p>
      )}
      <button
        type="button"
        className={a.key}
        style={{ height: 56, background: p.listo ? colors.yellow : colors.gray100 }}
        disabled={!p.listo || p.enviando}
        data-testid="vincular-continuar"
        onClick={p.onContinuar}
      >
        {p.enviando ? 'Vinculando…' : 'Vincular caja'}
      </button>
    </>
  );
}

export function Vincular(p: { readonly onVinculado: (r: Vinculo) => void }) {
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const listo = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && codigo.length === 8;

  async function vincular(): Promise<void> {
    if (!listo || enviando) return;
    setEnviando(true);
    setError(null);
    const r = await activar(email, codigo);
    setEnviando(false);
    if (r.ok) p.onVinculado(r.vinculo);
    else setError(r.mensaje);
  }

  return (
    <>
      <Intro />
      <Campos email={email} codigo={codigo} onEmail={setEmail} onCodigo={setCodigo} />
      <span className={a.hint}>
        Ocho caracteres. No distingue mayúsculas y puedes escribir el espacio o el guion: se
        ignoran.
      </span>
      <Pie error={error} listo={listo} enviando={enviando} onContinuar={() => void vincular()} />
      <AvisoVinculacion />
    </>
  );
}
