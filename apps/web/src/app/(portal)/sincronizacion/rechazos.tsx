'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button, DataTable, type ColumnDef } from '@/components';
import { motivoDeRechazo } from '@/lib/sync-motivos';
import { marcarRechazoResuelto } from '@/server/actions/rechazos';
import type { SincronizacionData } from '@/server/screens';

/**
 * «Registros no enviados» (P-11): what was refused, from which device, why —
 * a sentence, never a code — and «Marcar como resuelto», which is saved
 * (`resolved_at`), not just hidden. Owner and admin only; hidden for Solo
 * lectura, and the action refuses regardless.
 */
type Rejection = SincronizacionData['rechazos'][number];

const preview = (payload: unknown): string =>
  (payload as { preview?: string } | null)?.preview ?? '—';

function ResolverButton({ id }: { readonly id: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const resolver = () =>
    startTransition(async () => {
      const r = await marcarRechazoResuelto(id);
      if (!r.ok) return setError(r.message);
      router.refresh();
    });
  return (
    <>
      <Button size="sm" variant="secondary" onClick={resolver} disabled={pending}>
        Marcar como resuelto
      </Button>
      {error === null ? null : <span role="alert">{error}</span>}
    </>
  );
}

const columns = (mayWrite: boolean): readonly ColumnDef<Rejection>[] => [
  { key: 'tipo', header: 'Tipo de registro', render: (r) => r.tableName },
  {
    key: 'dispositivo',
    header: 'Dispositivo',
    render: (r) => r.dispositivo ?? 'Dispositivo desvinculado',
  },
  { key: 'motivo', header: 'Motivo', render: (r) => motivoDeRechazo(r.code) },
  { key: 'preview', header: 'Vista previa', render: (r) => preview(r.payload) },
  ...(mayWrite
    ? [{ key: 'accion', header: '', render: (r: Rejection) => <ResolverButton id={r.id} /> }]
    : []),
];

export function RechazosTable(props: {
  readonly rows: readonly Rejection[];
  readonly mayWrite: boolean;
}) {
  return (
    <DataTable
      caption="Registros no enviados"
      columns={columns(props.mayWrite)}
      rows={props.rows}
      rowKey={(r) => r.id}
      minWidth={980}
      footer={<span>Mostrando {props.rows.length} registros rechazados</span>}
    />
  );
}
