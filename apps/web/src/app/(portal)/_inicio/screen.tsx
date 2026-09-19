'use client';

import { Banner, ScreenBody, ExportButton } from '@/components';
import { button } from '@/components/button.css';
import type { InicioData } from '@/server/inicio';
import { canWrite, resolveScreenState } from '@/session/gating';
import type { Role } from '@/session/types';

import { ActividadReciente, CajaCard, ResumenDeHoy, StockBajoCard, UtilidadHero } from './cards';
import { ChecklistCard } from './checklist-card';
import { saludo } from './saludo';
import { Ultimos30Dias } from './ultimos-30';
import { grid3, heroRow, pageDate, pageTitle, sectionTitle } from './inicio.css';

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

function PageHeading({
  mayWrite,
  hoy,
  nombre,
}: {
  readonly mayWrite: boolean;
  readonly hoy: string;
  readonly nombre: string | null;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 className={pageTitle}>{saludo(nombre)}</h1>
        <p className={pageDate}>{fechaLarga(hoy)}</p>
      </div>
      {mayWrite ? (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <ExportButton dataset="ventas" />
        </div>
      ) : null}
    </div>
  );
}

function LowStockBanner({ count }: { readonly count: number }) {
  return (
    <Banner
      tone="warning"
      title={`${count} productos están por debajo de su umbral.`}
      body="Repón antes de que tus operadores se queden sin qué vender."
      action={
        <a className={button({ variant: 'secondary', size: 'sm' })} href="/productos?filtro=bajo">
          Ver productos
        </a>
      }
    />
  );
}

function Dashboard({ data }: { readonly data: InicioData }) {
  return (
    <>
      <div className={heroRow}>
        <UtilidadHero
          month={data.month}
          rango={`${fechaCorta(data.mesDesde)} – ${fechaCorta(data.mesHasta)}`}
        />
        <ChecklistCard checklist={data.checklist} />
      </div>
      <h2 className={sectionTitle}>Resumen de hoy</h2>
      <ResumenDeHoy today={data.today} />
      <h2 className={sectionTitle}>Últimos 30 días</h2>
      <Ultimos30Dias serie={data.serie} />
      <div className={grid3}>
        <CajaCard cortes={data.cortes} />
        <StockBajoCard rows={data.lowStock} />
        <ActividadReciente rows={data.activity} />
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
}

export function InicioScreen({ data, role, nombre, hoy }: InicioScreenProps) {
  const state = resolveScreenState({
    error: data === null,
    isEmpty: data !== null && data.month.ventasCount === 0 && data.month.gastosCount === 0,
  });

  return (
    <>
      {data !== null && data.lowStock.length > 0 ? (
        <LowStockBanner count={data.lowStock.length} />
      ) : null}

      <PageHeading mayWrite={canWrite(role)} hoy={hoy} nombre={nombre} />

      <ScreenBody
        state={state}
        onRetry={() => window.location.reload()}
        empty={{
          title: 'Aún no hay movimientos',
          body: 'Las ventas que registren tus operadores en el teléfono aparecerán aquí.',
        }}
      >
        {data === null ? null : <Dashboard data={data} />}
      </ScreenBody>
    </>
  );
}
