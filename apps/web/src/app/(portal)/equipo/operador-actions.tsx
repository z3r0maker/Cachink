'use client';

import { useState } from 'react';

import { Button } from '@/components';
import type { OperadorResult } from '@/server/actions/operadores';

import { DesactivarDialog, PinDialog } from './operador-dialogs';
import { PermisosDialog } from './permisos-dialog';

/** «Editar permisos» and its dialog; keyed so a saved change reopens fresh. */
function PermisosButton(props: {
  readonly id: string;
  readonly nombre: string;
  readonly permisos: { readonly canCancelSales: boolean };
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Editar permisos
      </Button>
      <PermisosDialog
        key={String(props.permisos.canCancelSales)}
        id={props.id}
        nombre={props.nombre}
        canCancelSales={props.permisos.canCancelSales}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

/**
 * `onWarning` is lifted to the list: deactivating the last operator unmounts
 * this card's actions, so a notice kept here would vanish with them.
 */
interface Props {
  readonly id: string;
  readonly nombre: string;
  readonly onWarning: (warning: string | null) => void;
  /** Present only where the plan includes per-operator permissions. */
  readonly permisos: { readonly canCancelSales: boolean } | null;
}

export function OperadorActions({ id, nombre, onWarning, permisos }: Props) {
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
      {permisos === null ? null : <PermisosButton id={id} nombre={nombre} permisos={permisos} />}
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
