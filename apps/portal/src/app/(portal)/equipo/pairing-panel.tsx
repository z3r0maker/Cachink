'use client';

import { useState, useTransition } from 'react';

import { Button, Card, PendingButton } from '@/components';
import { generarCodigo } from '@/server/actions/equipo';

import { codeBox, codeRow, panelTitle } from './equipo.css';

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
export function PairingPanel({ initial }: { readonly initial: LiveCode | null }) {
  const [live, setLive] = useState<LiveCode | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function generate(): void {
    startTransition(async () => {
      const result = await generarCodigo();
      if (!result.ok) return setError(result.message);
      setError(null);
      setLive({ code: result.code, expiresAt: result.expiresAt });
    });
  }

  return (
    <Card tone="hero" emphasis="hero">
      <strong className={panelTitle}>Código de vinculación activo</strong>
      <p style={{ margin: '8px 0 0', fontWeight: 600 }}>
        {live === null
          ? 'No hay un código activo. Genera uno para vincular un teléfono.'
          : `Escríbelo en el teléfono del operador. Vence ${remaining(live.expiresAt)}.`}
      </p>
      {live === null ? null : <CodeBoxes code={live.code} />}
      {error === null ? null : <p role="alert">{error}</p>}
      <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Button variant="dark" onClick={generate} disabled={pending}>
          {pending ? 'Generando…' : live === null ? 'Generar código' : 'Generar otro'}
        </Button>
        <PendingButton reason="Falta el envío de correo (B-14).">Enviar por correo</PendingButton>
      </div>
    </Card>
  );
}
