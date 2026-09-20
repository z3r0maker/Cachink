import Link from 'next/link';
import { notFound } from 'next/navigation';

import { enviarMigracion } from '@/server/actions/migraciones';
import { assistedImportDetail, filesOf, type AssistedFileMeta } from '@/server/db/assisted-imports';
import { db } from '@/server/db/client';
import { requireStaffPage } from '@/server/staff';
import { body, heading } from '@/styles/ui.css';

import { wide } from '../../tenants/tenants.css';
import { formStack } from './migracion.css';

/**
 * N-18 · One assisted import: the tenant's request and files (download), and
 * the staff mapping flow — plantilla + the mapped file → «Enviar al negocio».
 * Applying is the tenant's claim alone.
 */
export const dynamic = 'force-dynamic';

const ESTADO: Record<string, string> = {
  revision: 'En revisión',
  esperando_aprobacion: 'Esperando al negocio',
  aplicada: 'Aplicada',
  rechazada: 'Cancelada',
  expirada: 'Expirada',
};

export default async function MigracionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaffPage();
  const { id } = await params;
  const [row] = await assistedImportDetail(db(), id);
  if (row === undefined) notFound();
  const files = await filesOf(db(), id);

  return (
    <main className={wide}>
      <h1 className={heading}>
        Migración {row.createdAt.slice(0, 10)} · {row.id.slice(-6)}
      </h1>
      <p className={body}>
        Estado: <strong>{ESTADO[row.status] ?? row.status}</strong> · Negocio{' '}
        {row.businessId.slice(-8)} · Sistema actual: {row.sistemaActual}
        {row.plantilla !== null ? ` · Plantilla: ${row.plantilla}` : ''}
      </p>
      {row.notas !== '' ? <p className={body}>«{row.notas}»</p> : null}

      <Archivos files={files} />

      {row.status === 'revision' ? (
        <FormularioEnvio id={row.id} businessId={row.businessId} />
      ) : null}

      <p>
        <Link href="/migraciones">← Todas las migraciones</Link>
      </p>
    </main>
  );
}

function FormularioEnvio({ id, businessId }: { readonly id: string; readonly businessId: string }) {
  return (
    <>
      <h2>Enviar al negocio</h2>
      <p className={body}>
        Sube el archivo ya mapeado a una plantilla; el negocio verá la revisión (cuántos rows
        nuevos/actualizados) y lo aplicará él mismo.
      </p>
      <form action={enviarMigracionForm} className={formStack}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="business_id" value={businessId} />
        <label>
          Plantilla
          <select name="plantilla" defaultValue="productos">
            <option value="productos">Productos</option>
            <option value="clientes">Clientes</option>
          </select>
        </label>
        <label>
          Archivo mapeado (.xlsx/.csv)
          <input type="file" name="archivo" accept=".xlsx,.csv,text/csv" required />
        </label>
        <button type="submit">Enviar al negocio</button>
      </form>
    </>
  );
}

function Archivos({ files }: { readonly files: readonly AssistedFileMeta[] }) {
  return (
    <>
      <h2>Archivos del negocio</h2>
      <ul>
        {files
          .filter((f) => f.role === 'solicitud')
          .map((f) => (
            <li key={f.id}>
              <a href={`/api/staff/migraciones/archivos/${f.id}`} download>
                {f.filename}
              </a>{' '}
              <span className={body}>({Math.ceil(f.sizeBytes / 1024)} KB)</span>
            </li>
          ))}
      </ul>
      <ArchivoMapeado files={files} />
    </>
  );
}

function ArchivoMapeado({ files }: { readonly files: readonly AssistedFileMeta[] }) {
  const mapeado = files.find((f) => f.role === 'mapeado');
  if (mapeado === undefined) return null;
  return (
    <p className={body}>
      Archivo mapeado:{' '}
      <a href={`/api/staff/migraciones/archivos/${mapeado.id}`} download>
        {mapeado.filename}
      </a>
    </p>
  );
}

async function enviarMigracionForm(form: FormData): Promise<void> {
  'use server';
  await enviarMigracion(form);
}
