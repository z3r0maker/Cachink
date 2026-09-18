'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { isValidPin } from '@xangarro/domain';

import { Button, ConfirmDialog, Input } from '@/components';
import {
  crearOperador,
  desactivarOperador,
  restablecerPin,
  type OperadorResult,
} from '@/server/actions/operadores';

/**
 * Operator dialogs (B-13 / P-05).
 *
 * PIN format is checked here with the **same** `isValidPin` the use case uses,
 * so the shopkeeper hears about a 3-digit PIN before a round trip — and the
 * server refuses it regardless, because a browser check is a courtesy.
 */
const PIN_HINT = 'El PIN debe tener de 4 a 6 números.';

function useAction(onDone: (r: OperadorResult & { ok: true }) => void) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const run = (action: () => Promise<OperadorResult>): void =>
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setError(result.message);
      setError(null);
      onDone(result);
      router.refresh();
    });

  return { error, setError, pending, run };
}

function useNuevoOperador(onClose: () => void) {
  const [nombre, setNombre] = useState('');
  const [pin, setPin] = useState('');
  const action = useAction(() => {
    onClose();
    setNombre('');
    setPin('');
  });

  function save(): void {
    if (nombre.trim().length === 0) return action.setError('Escribe el nombre.');
    if (!isValidPin(pin)) return action.setError(PIN_HINT);
    action.run(() => crearOperador(nombre, pin));
  }

  return { nombre, setNombre, pin, setPin, save, ...action };
}

function NuevoFields({ f }: { readonly f: ReturnType<typeof useNuevoOperador> }) {
  return (
    <>
      <Input
        labelText="Nombre"
        value={f.nombre}
        onChange={(e) => f.setNombre(e.target.value)}
        data-testid="operador-nombre"
      />
      <Input
        labelText="PIN"
        hintText="De 4 a 6 números"
        numeric
        value={f.pin}
        onChange={(e) => f.setPin(e.target.value)}
        error={f.error ?? undefined}
        data-testid="operador-pin"
      />
    </>
  );
}

export function NuevoOperadorDialog({
  disabled,
  limit,
}: {
  readonly disabled: boolean;
  readonly limit: number;
}) {
  const [open, setOpen] = useState(false);
  const f = useNuevoOperador(() => setOpen(false));

  return (
    <>
      {/* Disabled rather than hidden: the limit is the message. */}
      <Button
        disabled={disabled}
        title={`Tu plan incluye ${limit} operadores`}
        onClick={() => setOpen(true)}
      >
        Nuevo operador
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Nuevo operador"
        body="Entra al teléfono con su nombre y su PIN. No necesita correo."
        confirmLabel={f.pending ? 'Guardando…' : 'Guardar'}
        onConfirm={f.save}
      >
        <NuevoFields f={f} />
      </ConfirmDialog>
    </>
  );
}

interface DialogProps {
  readonly id: string;
  readonly nombre: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onDone: (r: OperadorResult & { ok: true }) => void;
}

function PinDialog({ id, nombre, open, onOpenChange, onDone }: DialogProps) {
  const [pin, setPin] = useState('');
  const { error, setError, pending, run } = useAction((r) => {
    setPin('');
    onDone(r);
  });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Nuevo PIN para ${nombre}`}
      body="Díselo en persona. El PIN anterior deja de funcionar al guardar."
      confirmLabel={pending ? 'Guardando…' : 'Guardar'}
      onConfirm={() => (isValidPin(pin) ? run(() => restablecerPin(id, pin)) : setError(PIN_HINT))}
    >
      <Input
        labelText="PIN nuevo"
        numeric
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        error={error ?? undefined}
        data-testid="operador-nuevo-pin"
      />
    </ConfirmDialog>
  );
}

function DesactivarDialog({ id, nombre, open, onOpenChange, onDone }: DialogProps) {
  const { pending, run } = useAction(onDone);
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Desactivar a ${nombre}`}
      body="No podrá entrar a los teléfonos. Sus ventas y registros se conservan."
      confirmLabel={pending ? 'Desactivando…' : 'Desactivar'}
      destructive
      onConfirm={() => run(() => desactivarOperador(id))}
    />
  );
}

export function OperadorActions({ id, nombre }: { readonly id: string; readonly nombre: string }) {
  const [mode, setMode] = useState<'pin' | 'off' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const done = (r: OperadorResult & { ok: true }): void => {
    setMode(null);
    setNotice(r.warning ?? null);
  };

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
      <Button size="sm" variant="secondary" onClick={() => setMode('pin')}>
        Restablecer PIN
      </Button>
      <Button size="sm" variant="secondary" onClick={() => setMode('off')}>
        Desactivar
      </Button>
      {notice === null ? null : (
        <p role="status" data-testid="operador-warning">
          {notice}
        </p>
      )}
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
