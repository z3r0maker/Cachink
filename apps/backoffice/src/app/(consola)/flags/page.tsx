import { db } from '@/server/db/client';
import { FLAG_COPY } from '@/server/flags/labels';
import { listFlags } from '@/server/flags/overview';
import { led } from '@/shell/shell.css';
import { flagDeps } from '@/server/flags/wiring';
import { requireStaffPage } from '@/server/staff';
import { body, heading } from '@/styles/ui.css';

import type { SearchParams } from '../search-params';
import { notice, wide } from '../tenants/tenants.css';
import { FlagEditor } from './editor';
import { groupTitle } from './flags.css';
import { FlagTable } from './flag-table';
import { HistoryDrawer } from './history-drawer';
import { parseFlagView } from './params';

/**
 * N-09 · Flags: the platform level of platform × plan × tenant (ADR-053) and
 * the kill switches. Every change is an audited, append-only event; devices
 * see it through their signed entitlement on the next pull.
 */
export const dynamic = 'force-dynamic';

export default async function FlagsPage(props: { searchParams: Promise<SearchParams> }) {
  await requireStaffPage();
  const view = parseFlagView(await props.searchParams);
  const { rows, tenantCount } = await listFlags(flagDeps(db()));
  const editing = rows.find((r) => r.key === view.editar) ?? null;

  return (
    <section className={wide} aria-labelledby="flags-title">
      <h1 id="flags-title" className={heading}>
        Flags
      </h1>
      <p className={body}>
        Disponibilidad por plataforma y kill switches. Una clave sin cambios usa el valor del
        código; el plan y los ajustes de cada negocio se aplican encima.
      </p>
      <p className={notice} role="note">
        Un cambio llega a cada dispositivo en su próxima sincronización (licencia firmada), no al
        instante.
      </p>
      {editing ? <FlagEditor row={editing} q={view.q} tenantCount={tenantCount} /> : null}
      <h2 className={groupTitle}>Funciones</h2>
      <FlagTable rows={rows.filter((r) => FLAG_COPY[r.key].tipo === 'Función')} />
      <h2 className={groupTitle}>
        <span className={led.bad} aria-hidden="true" />
        Kill switches · con tapa
      </h2>
      <FlagTable rows={rows.filter((r) => FLAG_COPY[r.key].tipo === 'Kill switch')} />
      {view.historial ? <HistoryDrawer flagKey={view.historial} /> : null}
    </section>
  );
}
