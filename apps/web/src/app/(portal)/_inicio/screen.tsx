'use client';

import { ScreenBody, ExportButton } from '@/components';
import type { InicioData } from '@/server/inicio';
import { canWrite, resolveScreenState } from '@/session/gating';
import type { Role } from '@/session/types';

import { briefing, pendientes } from './briefing';
import { ActividadReciente, CajaCard } from './cards';
import { HoyHero } from './hoy-hero';
import { HoyCard, MesCard } from './mes-card';
import { PendientesCard } from './pendientes-card';
import { saludo } from './saludo';
import { Ultimos30Dias } from './ultimos-30';
import { two } from './hoy.css';

const LONG = new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const SHORT = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** «martes, 12 de mayo de 2026» — the business's today, from the server clock. */
const fechaLarga = (hoy: string) => LONG.format(new Date(`${hoy}T12:00:00Z`));
/** «01/may/2026» — the month's bound, never a date pinned in code. */
const fechaCorta = (iso: string) => SHORT.format(new Date(`${iso}T12:00:00Z`)).replace(/ /g, '/');

/** The rows only the shell counts (pending sync rows, items to review). */
export interface HoyCounts {
  readonly pendingRows: number;
  readonly revisionPendiente: number;
}

function Dashboard({ data, counts }: { readonly data: InicioData; readonly counts: HoyCounts }) {
  const lista = pendientes({
    lowStock: data.lowStock,
    pendingRows: counts.pendingRows,
    revision: counts.revisionPendiente,
    checklist: data.checklist.items,
  });
  return (
    <>
      <div className={two}>
        <MesCard
          month={data.month}
          rango={`${fechaCorta(data.mesDesde)} – ${fechaCorta(data.mesHasta)}`}
        />
        <HoyCard today={data.today} />
      </div>
      <div className={two}>
        <PendientesCard items={lista} />
        <Ultimos30Dias serie={data.serie} />
      </div>
      <div className={two}>
        <ActividadReciente rows={data.activity} />
        <CajaCard cortes={data.cortes} />
      </div>
    </>
  );
}

export interface InicioScreenProps {
  /** `null` when the read failed — the screen renders its error state. */
  readonly data: InicioData | null;
  readonly role: Role;
  /** The account's display name, from the session (ADR-087). */
  readonly nombre: string | null;
  /** The business's today (`server/clock`), for the heading's date. */
  readonly hoy: string;
  readonly counts: HoyCounts;
}

const NO_DATA = {
  ventas: 0n,
  gastos: 0n,
  utilidad: 0n,
  ventasCount: 0,
  gastosCount: 0,
};

/**
 * Hoy (P-13, redesigned by ADR-107): Don Cuentas's briefing leads, then the
 * month and today, the pending list beside the last 30 days, and the latest
 * activity. The setup checklist moved to the sidebar and «¿Cómo empiezo?».
 */
export function InicioScreen({ data, role, nombre, hoy, counts }: InicioScreenProps) {
  const state = resolveScreenState({
    error: data === null,
    isEmpty: data !== null && data.month.ventasCount === 0 && data.month.gastosCount === 0,
  });
  return (
    <>
      <HoyHero
        saludo={saludo(nombre)}
        fecha={fechaLarga(hoy)}
        briefing={briefing(data?.month ?? NO_DATA)}
        extra={canWrite(role) ? <ExportButton dataset="ventas" /> : null}
      />
      <ScreenBody
        state={state}
        onRetry={() => window.location.reload()}
        empty={{
          title: 'Aún no hay movimientos',
          body: 'Las ventas que registren tus operadores en sus cajas aparecerán aquí.',
        }}
      >
        {data === null ? null : <Dashboard data={data} counts={counts} />}
      </ScreenBody>
    </>
  );
}
