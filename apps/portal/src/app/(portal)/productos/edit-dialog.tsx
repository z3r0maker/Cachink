'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { ConfirmDialog, Input } from '@/components';
import { editarProducto } from '@/server/actions/editar-producto';

import type { Producto } from './parts';

/**
 * Rename a product.
 *
 * The first write path in the portal, and deliberately the smallest one that is
 * still real: `products` is a HYBRID table, so a device creates the row at the
 * counter and the portal may only correct it (contract §8, ADR-058 §2). Editing
 * the name exercises the whole loop — server action, tenant transaction, use
 * case, RLS `WITH CHECK`, `sync_log` append — without also taking on
 * pesos-to-centavos parsing, which has its own edge cases and deserves its own
 * pass.
 */
function useRenameProducto(producto: Producto | null, onClose: () => void) {
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // Re-seed when a different row opens the dialog.
  useEffect(() => {
    setNombre(producto?.nombre ?? '');
    setError(null);
  }, [producto]);

  function save(): void {
    if (producto === null) return;
    const trimmed = nombre.trim();
    if (trimmed.length === 0) {
      setError('Escribe un nombre.');
      return;
    }

    startTransition(async () => {
      // The action returns errors rather than throwing them: a thrown error in
      // a server action reaches the client as an opaque digest, and the use
      // case's messages are sentences the shopkeeper is meant to read.
      const result = await editarProducto(producto.id, { nombre: trimmed });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onClose();
      // The action revalidates the path; this re-renders the server component
      // so the table shows the value that came back out of Postgres.
      router.refresh();
    });
  }

  return { nombre, setNombre, error, setError, pending, save };
}

export function EditProductDialog({
  producto,
  onClose,
}: {
  readonly producto: Producto | null;
  readonly onClose: () => void;
}) {
  const { nombre, setNombre, error, setError, pending, save } = useRenameProducto(
    producto,
    onClose,
  );

  return (
    <ConfirmDialog
      open={producto !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Editar producto"
      body="Corrige el nombre con el que aparece en tus reportes y comprobantes."
      confirmLabel={pending ? 'Guardando…' : 'Guardar'}
      onConfirm={save}
    >
      <Input
        labelText="Nombre"
        value={nombre}
        onChange={(e) => {
          setNombre(e.target.value);
          setError(null);
        }}
        error={error ?? undefined}
        data-testid="edit-producto-nombre"
      />
    </ConfirmDialog>
  );
}
