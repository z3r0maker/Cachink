'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { Button, ConfirmDialog, Input } from '@/components';
import { editarNegocio } from '@/server/actions/negocio';

interface Current {
  readonly nombre: string;
  readonly regimenFiscal: string;
}

function useEditNegocio(current: Current, onClose: () => void) {
  const [nombre, setNombre] = useState(current.nombre);
  const [regimen, setRegimen] = useState(current.regimenFiscal);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setNombre(current.nombre);
    setRegimen(current.regimenFiscal);
  }, [current.nombre, current.regimenFiscal]);

  function save(): void {
    startTransition(async () => {
      const result = await editarNegocio({
        nombre: nombre.trim(),
        regimenFiscal: regimen.trim(),
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return { nombre, setNombre, regimen, setRegimen, error, setError, pending, save };
}

interface FieldsProps {
  readonly nombre: string;
  readonly regimen: string;
  readonly error: string | null;
  readonly onNombre: (v: string) => void;
  readonly onRegimen: (v: string) => void;
}

function Fields({ nombre, regimen, error, onNombre, onRegimen }: FieldsProps) {
  return (
    <>
      <Input
        labelText="Nombre del negocio"
        value={nombre}
        onChange={(e) => onNombre(e.target.value)}
        data-testid="negocio-nombre"
      />
      <Input
        labelText="Régimen fiscal"
        value={regimen}
        onChange={(e) => onRegimen(e.target.value)}
        error={error ?? undefined}
        data-testid="negocio-regimen"
      />
    </>
  );
}

/**
 * Owner-only, and the server agrees.
 *
 * The régimen fiscal drives the NIF statements and every comprobante, which is
 * why `editarNegocio` requires `owner` rather than `admin` — hiding this button
 * from an admin is the courtesy; the action refusing them is the control.
 */
export function EditNegocioDialog({ current }: { readonly current: Current }) {
  const [open, setOpen] = useState(false);
  const { nombre, setNombre, regimen, setRegimen, error, setError, pending, save } = useEditNegocio(
    current,
    () => setOpen(false),
  );

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Editar datos
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Editar datos del negocio"
        body="Así aparece tu negocio en tus reportes, tus estados y tus comprobantes."
        confirmLabel={pending ? 'Guardando…' : 'Guardar'}
        onConfirm={save}
      >
        <Fields
          nombre={nombre}
          regimen={regimen}
          error={error}
          onNombre={(v) => {
            setNombre(v);
            setError(null);
          }}
          onRegimen={(v) => {
            setRegimen(v);
            setError(null);
          }}
        />
      </ConfirmDialog>
    </>
  );
}
