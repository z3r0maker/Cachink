'use client';

import { formatFechaHora, PLAN_LIMITS, PLAN_NOMBRE } from '@xangarro/domain';

import { Banner, Card, ScreenBody, UsageBar } from '@/components';
import { ASESOR_TIERS, PLAN_CARDS, precioDePlan } from '@/data/planes';
import type { ListarFacturasResult } from '@/server/billing/facturas-core';
import { administrarSuscripcion } from '@/server/billing/actions';
import type { SuscripcionData } from '@/server/suscripcion';
import { canWrite, isOwner, resolveScreenState } from '@/session/gating';
import { useSession } from '@/session/provider';
import { eyebrow, eyebrowOnYellow } from '@/styles/text.css';

import { BotonStripe } from './acciones';
import { estadoCopy } from './estado';
import { Facturas } from './facturas';
import { AsesorBlock, PauseRow } from './parts';
import { Planes } from './planes';
import { pageSubtitle, pageTitle, planName, usageLabel } from './suscripcion.css';

function CurrentPlan({ owner, data }: { readonly owner: boolean; readonly data: SuscripcionData }) {
  const session = useSession();
  const plan = PLAN_CARDS.find((p) => p.id === session.planId);
  const copy = estadoCopy(data.estado);
  const precio = precioDePlan(session.planId, data.estado?.interval ?? 'month');
  // A monthly subscriber can move to annual in the Customer Portal (N-01);
  // proration is Stripe's.
  const puedeAnual =
    data.estado !== null &&
    data.estado.interval === 'month' &&
    (data.estado.status === 'active' || data.estado.status === 'trialing');
  return (
    <Card tone="hero" emphasis="hero">
      <div className={eyebrowOnYellow}>Tu plan</div>
      <div className={planName} style={{ margin: '12px 0 8px' }}>
        {plan?.name}
      </div>
      <div style={{ fontWeight: 800 }}>
        ${precio.price}.00 <span style={{ fontWeight: 700 }}>{precio.period}</span>
      </div>
      <div style={{ marginTop: 14, fontWeight: 700 }} data-testid="suscripcion-estado">
        {copy.linea}
      </div>
      {owner ? (
        <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="#planes">Cambiar plan</a>
          {data.estado === null ? null : (
            <BotonStripe label="Administrar pago" accion={() => administrarSuscripcion()} />
          )}
          {puedeAnual ? (
            <BotonStripe
              label="Cambiar a anual — 2 meses gratis"
              accion={() => administrarSuscripcion()}
            />
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

/**
 * **Only capped allowances render a bar.** Drawing one against an unlimited
 * quota misreports it, so "sin límite" rows show text alone. Every number is
 * the business's own; a counter not computed yet reads «—».
 */
function Consumo({ uso }: { readonly uso: SuscripcionData['uso'] }) {
  const limits = PLAN_LIMITS[useSession().planId];
  return (
    <Card>
      <div className={eyebrow} style={{ marginBottom: 16 }}>
        Tu consumo este mes
      </div>
      <Metrica
        nombre="Operadores"
        usados={uso.operadores}
        label="Operadores activos"
        limite={limits.operators}
        primera
      />
      <Metrica
        nombre="Transacciones del mes"
        usados={uso.registros ?? 0}
        texto={uso.registros === null ? '—' : undefined}
        label="Transacciones del mes"
        limite={limits.transactionsPerMonth}
      />
      <Metrica
        nombre="Productos activos"
        usados={uso.productos ?? 0}
        texto={uso.productos === null ? '—' : undefined}
        label="Productos activos"
        limite={limits.activeProducts}
      />
      <Metrica
        nombre="Dispositivos vinculados"
        usados={uso.dispositivos}
        label="Dispositivos vinculados"
        limite={limits.devices}
      />
    </Card>
  );
}

/** One label + bar row of the consumption card (C-12's two new metrics ride here). */
function Metrica({
  nombre,
  usados,
  texto,
  label,
  limite,
  primera = false,
}: {
  readonly nombre: string;
  readonly usados: number;
  /** Shown instead of the count when no recompute has landed ('—'). */
  readonly texto?: string;
  readonly label: string;
  readonly limite: number;
  readonly primera?: boolean;
}) {
  return (
    <>
      <div className={usageLabel} style={primera ? undefined : { marginTop: 16 }}>
        <span>{nombre}</span>
        <span>
          {texto ?? `${usados}`} de {limite}
        </span>
      </div>
      <UsageBar used={usados} limit={limite} label={label} />
    </>
  );
}

function Contenido(props: {
  readonly data: SuscripcionData;
  readonly facturas: ListarFacturasResult;
  readonly owner: boolean;
}) {
  const { data, owner } = props;
  const mayWrite = canWrite(useSession().role);
  const aviso = estadoCopy(data.estado).aviso;
  return (
    <>
      {aviso === null ? null : <Banner tone="warning" title="Revisa tu pago" body={aviso} />}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 20,
        }}
      >
        <CurrentPlan owner={owner} data={data} />
        <Consumo uso={data.uso} />
      </div>
      <Planes owner={owner} />
      <AsesorBlock tiers={ASESOR_TIERS} />
      <Facturas
        r={props.facturas}
        owner={owner}
        mayWrite={mayWrite}
        fiscalCompleto={data.fiscalCompleto}
      />
      {owner && data.estado !== null ? <PauseRow /> : null}
      {/* The entitlement the phones are signed right now (P-10's debug line). */}
      <p style={{ fontWeight: 600 }} data-testid="entitlement-debug">
        Tus cajas reciben el plan {PLAN_NOMBRE[data.recibe.plan]}, válido hasta el{' '}
        {formatFechaHora(data.recibe.validUntil)}.
      </p>
    </>
  );
}

export function SuscripcionScreen({
  data,
  facturas,
}: {
  readonly data: SuscripcionData | null;
  readonly facturas: ListarFacturasResult;
}) {
  const owner = isOwner(useSession().role);
  return (
    <>
      <div>
        <h1 className={pageTitle}>Suscripción</h1>
        <p className={pageSubtitle}>Tu plan, tu consumo y tus comprobantes de pago</p>
      </div>
      <ScreenBody
        state={resolveScreenState({ error: data === null })}
        onRetry={() => window.location.reload()}
        /* No `empty`: there is always a plan to show, even the free one. The only
         thing here that can be empty is the invoice list, and that empty state
         lives inside the Facturas card (S-2). */
      >
        {data === null ? null : <Contenido data={data} facturas={facturas} owner={owner} />}
      </ScreenBody>
    </>
  );
}
