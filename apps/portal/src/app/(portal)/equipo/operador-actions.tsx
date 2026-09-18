'use client';

import { useState } from 'react';

import { Button } from '@/components';
import type { OperadorResult } from '@/server/actions/operadores';

import { DesactivarDialog, PinDialog } from './operador-dialogs';

/**
 * `onWarning` is lifted to the list: deactivating the last operator unmounts
 * this card's actions, so a notice kept here would vanish with them.
 */
export function OperadorActions({
  id,
  nombre,
  onWarning,
}: {
  readonly id: string;
  readonly nombre: string;
  readonly onWarning: (warning: string | null) => void;
}) {
  const [mode, setMode] = useState<'pin' | 'off' | null>(null);
  const done = (r: OperadorResult & { ok: true }): void => {
    setMode(null);
    onWarning(r.warning ?? null);
  };

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
      <Button size="sm" variant="secondary" onClick={() => setMode('pin')}>
        Reiniciar NIP
      </Button>
      <Button size="sm" variant="secondary" onClick={() => setMode('off')}>
        Desactivar
      </Button>
      <PinDialog
        id={id}
        nombre={nombre}
        open={mode === 'pin'}
        onOpenChange={(o) => setMode(o ? 'pin' : null)}
        onDone={done}
      />
      <DesactivarDialog
        id={id}
        nombre={nombre}
        open={mode === 'off'}
        onOpenChange={(o) => setMode(o ? 'off' : null)}
        onDone={done}
      />
    </div>
  );
}
