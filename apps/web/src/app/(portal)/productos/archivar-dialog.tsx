'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { ConfirmDialog } from '@/components';
import { archivarProducto } from '@/server/actions/archivar-producto';

import type { Producto } from './parts';

/** What archiving does; with stock left, what it hides too. */
function cuerpo(stock: number | null): string {
  return stock === null
    ? 'Deja de aparecer en tu catálogo y en tus cajas. Sus ventas pasadas se quedan en tus números.'
    : `Todavía tiene ${stock} en existencia. Si lo archivas se esconden con él, y tus cajas ya no lo van a poder cobrar.`;
}

/**
 * Archive, with its confirm (P-07). Asked twice only when it matters: with
 * units still on the shelf, the second question names how many will be hidden.
 */
export function ArchivarDialog(props: {
  readonly producto: Producto | null;
  readonly onClose: () => void;
}) {
  const [stock, setStock] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  useEffect(() => {
    setStock(null);
    setError(null);
  }, [props.producto]);

  const archive = () =>
    startTransition(async () => {
      if (props.producto === null) return;
      const r = await archivarProducto(props.producto.id, stock !== null);
      if (r.ok) {
        props.onClose();
        router.refresh();
      } else if (r.kind === 'stock') setStock(r.stock);
      else setError(r.message);
    });

  return (
    <ConfirmDialog
      open={props.producto !== null}
      onOpenChange={(open) => (open ? undefined : props.onClose())}
      title={`¿Archivar ${props.producto?.nombre ?? ''}?`}
      cancelLabel="Mejor no"
      body={error ?? cuerpo(stock)}
      confirmLabel={
        pending ? 'Archivando…' : stock === null ? 'Archivar' : 'Archivar de todos modos'
      }
      destructive
      onConfirm={archive}
    />
  );
}
