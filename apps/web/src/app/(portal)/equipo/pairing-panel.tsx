'use client';

import { useState, useTransition } from 'react';

import { Button, Card, Input } from '@/components';
import { enviarCodigoPorCorreo, generarCodigo } from '@/server/actions/equipo';

import { codeBox, codeRow, enviadoLine, panelTitle } from './equipo.css';
import { PairingQr } from './pairing-qr';

export interface LiveCode {
  readonly code: string;
  readonly expiresAt: string;
}

/** "en 47 h" / "en 12 min" — the only unit a shopkeeper needs to act on. */
function remaining(expiresAt: string, now: number = Date.now()): string {
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return 'ya venció';
  const hours = Math.floor(ms / 3_600_000);
  return hours >= 1 ? `en ${hours} h` : `en ${Math.max(1, Math.floor(ms / 60_000))} min`;
}

function CodeBoxes({ code }: { readonly code: string }) {
  return (
    <div className={codeRow} data-testid="activation-code" aria-label={`Código ${code}`}>
      {code.split('').map((c, i) => (
        <span key={`${c}-${i}`} className={codeBox}>
          {c}
        </span>
      ))}
    </div>
  );
}

/**
 * The pairing panel — the code a new phone types to join this business.
 *
 * Shows the **live** code from the database, not a fixture, and "Generar otro"
 * replaces it. The new code arrives in the action's result, so the panel
 * updates in place without a round trip through `router.refresh()`.
 *
 * Codes never contain 0, O, 1 or I — the alphabet is derived from the
 * contract's own regex, so the portal cannot mint one `/activate` would refuse.
 */
/**
 * What the panel says: full, no code yet, or where to type the live one. Full
 * still lets you generate — replacing a phone is «new code, then revoke the
 * old one», and the refused activation does not burn the code (B-12).
 */
function mensaje(lleno: boolean, limit: number, live: LiveCode | null): string {
  if (lleno) {
    return `Tu plan incluye ${limit} dispositivos y todos están vinculados. Un código nuevo solo funcionará cuando revoques uno.`;
  }
  if (live === null) return 'No hay un código activo. Genera uno para vincular un teléfono.';
  return `Escríbelo en el teléfono del operador. Vence ${remaining(live.expiresAt)}.`;
}

/** The handoff the code alone never had: where the person at the counter types it. */
function DondeCapturar({ url }: { readonly url: string }) {
  return (
    <p style={{ margin: '10px 0 0' }} data-testid="pairing-register-url">
      En la caja: abre <strong>{url}</strong> y captura el código con el correo del dueño.
    </p>
  );
}

/** The address field and the send, with its own pending state. */
function EnviarCorreo({ onEnviado }: { readonly onEnviado: (to: string) => void }) {
  const [correo, setCorreo] = useState('');
  const [enviando, startEnvio] = useTransition();
  const enviar = () => {
    startEnvio(async () => {
      const result = await enviarCodigoPorCorreo(correo);
      if (result.ok) onEnviado(result.sentTo);
    });
  };
  return (
    <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <Input
        labelText="Enviar el código por correo"
        type="email"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        data-testid="enviar-codigo-correo"
      />
      <Button variant="secondary" onClick={enviar} disabled={enviando}>
        {enviando ? 'Enviando…' : 'Enviar por correo'}
      </Button>
    </div>
  );
}

/** Generate + send-by-mail, with the send's own pending and sent states. */
function Acciones({
  live,
  pending,
  onGenerar,
}: {
  readonly live: LiveCode | null;
  readonly pending: boolean;
  readonly onGenerar: () => void;
}) {
  const [enviado, setEnviado] = useState<string | null>(null);
  return (
    <>
      <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Button variant="dark" onClick={onGenerar} disabled={pending}>
          {pending ? 'Generando…' : live === null ? 'Generar código' : 'Generar otro'}
        </Button>
      </div>
      {live === null ? null : <EnviarCorreo onEnviado={setEnviado} />}
      {enviado === null ? null : (
        <p role="status" className={enviadoLine}>
          Enviado a {enviado}.
        </p>
      )}
    </>
  );
}

export function PairingPanel({
  initial,
  lleno,
  limit,
  registerUrl,
}: {
  readonly initial: LiveCode | null;
  /** Every device slot is in use: activation would refuse (NO_DEVICE_SLOTS). */
  readonly lleno: boolean;
  readonly limit: number;
  /** Where the code is typed: the register's own door, so the handoff is complete. */
  readonly registerUrl: string;
}) {
  const [live, setLive] = useState<LiveCode | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const generate = () =>
    startTransition(async () => {
      const result = await generarCodigo();
      if (!result.ok) return setError(result.message);
      setError(null);
      setLive({ code: result.code, expiresAt: result.expiresAt });
    });

  return (
    <Card tone="hero" emphasis="hero">
      <strong className={panelTitle}>Código de vinculación activo</strong>
      <p style={{ margin: '8px 0 0', fontWeight: 600 }}>{mensaje(lleno, limit, live)}</p>
      {live === null ? null : <CodeBoxes code={live.code} />}
      {live === null ? null : <DondeCapturar url={registerUrl} />}
      {live === null ? null : <PairingQr codeKey={live.code} />}
      {error === null ? null : <p role="alert">{error}</p>}
      <Acciones live={live} pending={pending} onGenerar={generate} />
    </Card>
  );
}
