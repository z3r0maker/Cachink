import Link from 'next/link';

import { db } from '@/server/db/client';
import { allowlistCandidates } from '@/server/flags/candidates';
import { FLAG_COPY } from '@/server/flags/labels';
import type { FlagRow } from '@/server/flags/overview';
import { flagDeps } from '@/server/flags/wiring';
import { buttonQuiet, field, heading, input, label, muted } from '@/styles/ui.css';

import { filters } from '../tenants/tenants.css';
import { EditForm } from './edit-form';
import { editor } from './flags.css';

interface Props {
  readonly row: FlagRow;
  readonly q: string | null;
  readonly tenantCount: number;
}

/** N-06's tenant search, as a GET form that keeps the editor open. */
function TenantSearch({ row, q }: Pick<Props, 'row' | 'q'>) {
  return (
    <form method="get" action="/flags" className={filters} role="search">
      <input type="hidden" name="editar" value={row.key} />
      <label className={field}>
        <span className={label}>Buscar negocio para la lista</span>
        <input
          className={input}
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Nombre, correo del dueño o ID"
        />
      </label>
      <button className={buttonQuiet} type="submit">
        Buscar
      </button>
    </form>
  );
}

/**
 * The edit dialog, opened by `?editar=<key>`. Server-rendered and open, so it
 * works without script; the confirmation inside it is `ConfirmForm`'s modal.
 * Search first, then tick: a search reloads the page, keeping the saved list but not unsaved ticks.
 */
export async function FlagEditor({ row, q, tenantCount }: Props) {
  const candidates = await allowlistCandidates(
    flagDeps(db()).directory,
    row.state.allowlistBusinessIds,
    q,
  );
  const copy = FLAG_COPY[row.key];
  return (
    <dialog open className={editor} aria-labelledby="flag-editor-title">
      <h2 id="flag-editor-title" className={heading}>
        Editar: {copy.nombre}
      </h2>
      <p className={muted}>
        {copy.tipo}. Predeterminado en código: {row.defaultOn ? 'encendido' : 'apagado'}.
      </p>
      <TenantSearch row={row} q={q} />
      <EditForm
        flagKey={row.key}
        nombre={copy.nombre}
        current={row.state.mode}
        tenantCount={tenantCount}
        candidates={candidates}
      />
      <Link href="/flags">Cerrar</Link>
    </dialog>
  );
}
