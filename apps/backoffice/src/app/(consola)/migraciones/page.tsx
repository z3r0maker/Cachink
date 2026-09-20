import Link from 'next/link';

import { assistedImportsList } from '@/server/db/assisted-imports';
import { db } from '@/server/db/client';
import { requireStaffPage } from '@/server/staff';
import { body, heading } from '@/styles/ui.css';

import { wide } from '../tenants/tenants.css';

/** N-18 · Migraciones asistidas: every «Hazlo por mí» request, newest first. */
export const dynamic = 'force-dynamic';

const ESTADO: Record<string, string> = {
  revision: 'En revisión',
  esperando_aprobacion: 'Esperando al negocio',
  aplicada: 'Aplicada',
  rechazada: 'Cancelada',
  expirada: 'Expirada',
};

type Row = Awaited<ReturnType<typeof assistedImportsList>>[number];

export default async function MigracionesPage() {
  await requireStaffPage();
  const rows = await assistedImportsList(db());
  return (
    <main className={wide}>
      <h1 className={heading}>Migraciones asistidas</h1>
      <p className={body}>
        Solicitudes de «Hazlo por mí». Descarga los archivos, mápealos a una plantilla y envíalos al
        negocio para su aprobación — el negocio aplica, nunca el equipo.
      </p>
      <TablaMigraciones rows={rows} />
    </main>
  );
}

function TablaMigraciones({ rows }: { readonly rows: readonly Row[] }) {
  if (rows.length === 0) return <p className={body}>Todavía no hay solicitudes.</p>;
  return (
    <table>
      <thead>
        <tr>
          <th>Solicitud</th>
          <th>Negocio</th>
          <th>Estado</th>
          <th>Sistema actual</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>
              <Link href={`/migraciones/${r.id}`}>
                {r.createdAt.slice(0, 10)} · {r.id.slice(-6)}
              </Link>
            </td>
            <td>{r.businessId.slice(-8)}</td>
            <td>{ESTADO[r.status] ?? r.status}</td>
            <td>{r.sistemaActual}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
