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

import { NipInput } from './nip-input';

/**
 * Operator dialogs (B-13 / P-05).
 *
 * NIP format is checked here with the **same** `isValidPin` the use case uses,
 * so the shopkeeper hears about a 3-digit NIP before a round trip — and the
 * server refuses it regardless, because a browser check is a courtesy.
 */
const PIN_HINT = 'El NIP debe tener 4 números.';
const MISMATCH = 'Los dos NIP no coinciden.';

/** The one NIP check both dialogs run before a round trip. */
const nipProblem = (pin: string, confirm: string): string | null =>
  !isValidPin(pin) ? PIN_HINT : pin !== confirm ? MISMATCH : null;

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

function useNuevoOperador(onClose: () => void, inicial = '') {
  const [nombre, setNombre] = useState(inicial);
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const action = useAction(() => {
    onClose();
    setNombre(inicial);
    setPin('');
    setConfirm('');
  });

  function save(): void {
    if (nombre.trim().length === 0) return action.setError('Escribe el nombre.');
    const problem = nipProblem(pin, confirm);
    if (problem !== null) return action.setError(problem);
    action.run(() => crearOperador(nombre, pin));
  }

  return { nombre, setNombre, pin, setPin, confirm, setConfirm, save, ...action };
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
      <NipInput label="NIP" value={f.pin} onChange={f.setPin} testId="operador-pin" />
      <NipInput
        label="Confirma el NIP"
        value={f.confirm}
        onChange={f.setConfirm}
        error={f.error ?? undefined}
        testId="operador-pin-confirmar"
      />
    </>
  );
}

export function NuevoOperadorDialog({
  disabled,
  limit,
  nombreInicial = '',
  label = 'Nuevo operador',
}: {
  readonly disabled: boolean;
  readonly limit: number;
  /** «Darle acceso a la caja» from a payroll row: the name is already known. */
  readonly nombreInicial?: string;
  readonly label?: string;
}) {
  const [open, setOpen] = useState(false);
  const f = useNuevoOperador(() => setOpen(false), nombreInicial);

  return (
    <>
      {/* Disabled rather than hidden: the limit is the message. */}
      <Button
        variant={label === 'Nuevo operador' ? 'primary' : 'secondary'}
        disabled={disabled}
        title={`Tu plan incluye ${limit} operadores`}
        aria-label={nombreInicial === '' ? undefined : `${label} a ${nombreInicial}`}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Nuevo operador"
        body="Entra a la caja con su nombre y su NIP. No necesita correo."
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

export function PinDialog({ id, nombre, open, onOpenChange, onDone }: DialogProps) {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const { error, setError, pending, run } = useAction((r) => {
    setPin('');
    setConfirm('');
    onDone(r);
  });
  const save = () => {
    const problem = nipProblem(pin, confirm);
    return problem === null ? run(() => restablecerPin(id, pin)) : setError(problem);
  };
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Nuevo NIP para ${nombre}`}
      body="Díselo en persona. El NIP anterior deja de funcionar al guardar."
      confirmLabel={pending ? 'Guardando…' : 'Guardar'}
      onConfirm={save}
    >
      <NipInput label="NIP nuevo" value={pin} onChange={setPin} testId="operador-nuevo-pin" />
      <NipInput
        label="Confirma el NIP nuevo"
        value={confirm}
        onChange={setConfirm}
        error={error ?? undefined}
        testId="operador-nuevo-pin-confirmar"
      />
    </ConfirmDialog>
  );
}

export function DesactivarDialog({ id, nombre, open, onOpenChange, onDone }: DialogProps) {
  const { pending, run } = useAction(onDone);
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Desactivar a ${nombre}`}
      body="No podrá entrar a las cajas. Sus ventas y registros se conservan."
      confirmLabel={pending ? 'Desactivando…' : 'Desactivar'}
      destructive
      onConfirm={() => run(() => desactivarOperador(id))}
    />
  );
}
