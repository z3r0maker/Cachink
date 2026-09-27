'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button, ConfirmDialog, Input } from '@/components';
import { archivarNegocio } from '@/server/actions/archivar-negocio';

import * as n from './negocio.css';

/**
 * The archive row (P-08), owner only. Typing the name is the confirmation:
 * archiving signs everyone out and unlinks every phone, so it should never
 * happen from one misplaced tap.
 */
function useArchivar() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const confirm = () =>
    startTransition(async () => {
      const r = await archivarNegocio(typed);
      if (!r.ok) return setError(r.message);
      router.replace('/login');
      router.refresh();
    });
  const onTyped = (v: string) => {
    setTyped(v);
    setError(null);
  };
  return { open, setOpen, typed, onTyped, error, pending, confirm };
}

export function ArchivarNegocio({ nombre }: { readonly nombre: string }) {
  const { open, setOpen, typed, onTyped, error, pending, confirm } = useArchivar();
  return (
    <section className={n.archivar} aria-labelledby="negocio-archivar">
      <span className={n.compactaTexto}>
        <h2 id="negocio-archivar" className={n.archivarTitulo}>
          Archivar negocio
        </h2>
        <span className={n.compactaSub}>
          Nadie podrá entrar y las cajas se desconectan. No se borra nada; te pediremos escribir el
          nombre para confirmar.
        </span>
      </span>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Archivar negocio
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        destructive
        title="¿Archivar tu negocio?"
        body={`Nadie podrá entrar y las cajas se desconectan. Para confirmar, escribe «${nombre}».`}
        confirmLabel={pending ? 'Archivando…' : 'Archivar'}
        onConfirm={confirm}
      >
        <Input
          labelText="Nombre del negocio"
          value={typed}
          onChange={(ev) => onTyped(ev.target.value)}
          error={error ?? undefined}
          data-testid="archivar-confirmacion"
        />
      </ConfirmDialog>
    </section>
  );
}
