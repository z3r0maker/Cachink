'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button, ConfirmDialog } from '@/components';
import { revocarDispositivo } from '@/server/actions/dispositivos';

/**
 * "Revocar", behind a confirmation.
 *
 * The copy carries the consequence (plan B-12, P-06): revoking removes the
 * phone's access, not the data it already synced — and anything it had not
 * synced yet is lost with it. That last part is the irreversible bit, so it is
 * said before the click rather than discovered after.
 */
export function RevokeButton({
  deviceId,
  nombre,
  label = 'Revocar',
}: {
  readonly deviceId: string;
  readonly nombre: string;
  /** «Desvincular» in the drawer, as the design names it there. */
  readonly label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function revoke(): void {
    startTransition(async () => {
      const result = await revocarDispositivo(deviceId);
      if (!result.ok) return setError(result.message);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Revocar ${nombre}`}
        body="Revocar borra el acceso, no los datos ya sincronizados. Lo que esta caja no haya enviado todavía se perderá."
        confirmLabel={pending ? 'Revocando…' : 'Revocar'}
        destructive
        onConfirm={revoke}
      >
        {error === null ? null : <p role="alert">{error}</p>}
      </ConfirmDialog>
    </>
  );
}
