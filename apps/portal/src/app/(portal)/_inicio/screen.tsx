'use client';

import { Banner, Button, ScreenBody } from '@/components';
import type { InicioData } from '@/server/inicio';
import { canWrite, resolveScreenState } from '@/session/gating';
import type { Role } from '@/session/types';

import { ActividadReciente, CajaCard, ResumenDeHoy, StockBajoCard, UtilidadHero } from './cards';
import { grid3, heroRow, pageDate, pageTitle, sectionTitle } from './inicio.css';

const TODAY_LABEL = new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date(2026, 4, 12));

function PageHeading({ mayWrite }: { readonly mayWrite: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 className={pageTitle}>Hola, Pedro</h1>
        <p className={pageDate}>{TODAY_LABEL}</p>
      </div>
      {mayWrite ? (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <Button variant="secondary">Exportar</Button>
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
        <Button size="sm" variant="secondary">
          Ver productos
        </Button>
      }
    />
  );
}

function Dashboard({ data }: { readonly data: InicioData }) {
  return (
    <>
      <div className={heroRow}>
        <UtilidadHero month={data.month} />
      </div>
      <h2 className={sectionTitle}>Resumen de hoy</h2>
      <ResumenDeHoy today={data.today} />
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
}

export function InicioScreen({ data, role }: InicioScreenProps) {
  const state = resolveScreenState({
    error: data === null,
    isEmpty: data !== null && data.month.ventasCount === 0 && data.month.gastosCount === 0,
  });

  return (
    <>
      {data !== null && data.lowStock.length > 0 ? (
        <LowStockBanner count={data.lowStock.length} />
      ) : null}

      <PageHeading mayWrite={canWrite(role)} />

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
