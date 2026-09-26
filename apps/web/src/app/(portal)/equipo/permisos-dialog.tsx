'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { ConfirmDialog, Switch } from '@/components';
import { cambiarPermisos } from '@/server/actions/operadores';

/**
 * «Editar permisos» (P-05). v1 has one permission: cancelling sales from the
 * phone. Rendered only where the plan includes it; the server checks again.
 */
export function PermisosDialog(props: {
  readonly id: string;
  readonly nombre: string;
  readonly canCancelSales: boolean;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const [cancelar, setCancelar] = useState(props.canCancelSales);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const save = () =>
    startTransition(async () => {
      const r = await cambiarPermisos(props.id, { canCancelSales: cancelar });
      if (!r.ok) return setError(r.message);
      props.onOpenChange(false);
      router.refresh();
    });
  return (
    <ConfirmDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={`Permisos de ${props.nombre}`}
      body="Lo que puede hacer en la caja además de vender. Llega en su siguiente sincronización."
      confirmLabel={pending ? 'Guardando…' : 'Guardar'}
      onConfirm={save}
    >
      <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Switch checked={cancelar} label="Puede cancelar ventas" onCheckedChange={setCancelar} />
        Puede cancelar ventas
      </label>
      {error === null ? null : <p role="alert">{error}</p>}
    </ConfirmDialog>
  );
}
