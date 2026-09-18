'use client';

import { PLAN_LIMITS } from '@xangarro/domain';

import { Button, Card, ScreenBody, UsageBar } from '@/components';
import { useSession } from '@/session/provider';
import { ASESOR_TIERS, INVOICES, PLAN_CARDS } from '@/fixtures/planes';
import { isOwner, resolveScreenState } from '@/session/gating';

import { eyebrow, eyebrowOnYellow } from '@/styles/text.css';

import { AsesorBlock, Comprobantes, PauseRow } from './parts';
import { PlanCard } from './plan-card';
import { pageSubtitle, pageTitle, planGrid, planName, usageLabel } from './suscripcion.css';

function CurrentPlan({ owner }: { readonly owner: boolean }) {
  const session = useSession();
  const plan = PLAN_CARDS.find((p) => p.id === session.planId);
  return (
    <Card tone="hero" emphasis="hero">
      <div className={eyebrowOnYellow}>Tu plan</div>
      <div className={planName} style={{ margin: '12px 0 8px' }}>
        {plan?.name}
      </div>
      <div style={{ fontWeight: 800 }}>
        ${plan?.price}.00 <span style={{ fontWeight: 700 }}>{plan?.period}</span>
      </div>
      <div style={{ marginTop: 14, fontWeight: 700 }}>Siguiente cobro: 01/jun/2026</div>
      {owner ? (
        <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="dark">Cambiar plan</Button>
          <Button variant="secondary">Administrar pago</Button>
        </div>
      ) : null}
    </Card>
  );
}

/**
 * **Only capped allowances render a bar.** Drawing one against an unlimited
 * quota misreports it, so "sin límite" rows show text alone.
 */
function Consumo() {
  const session = useSession();
  const limits = PLAN_LIMITS[session.planId];
  return (
    <Card>
      <div className={eyebrow} style={{ marginBottom: 16 }}>
        Tu consumo este mes
      </div>
      <div className={usageLabel}>
        <span>Usuarios</span>
        <span>2 de {limits.operators}</span>
      </div>
      <UsageBar used={2} limit={limits.operators} label="Usuarios usados" />
      <div className={usageLabel} style={{ marginTop: 16 }}>
        <span>Registros del mes</span>
        <span>
          {limits.recordsPerMonth === null
            ? '340 · sin límite'
            : `340 de ${limits.recordsPerMonth}`}
        </span>
      </div>
      <UsageBar used={340} limit={limits.recordsPerMonth} label="Registros del mes" />
      <div className={usageLabel} style={{ marginTop: 16 }}>
        <span>Dispositivos vinculados</span>
        <span>2 de {limits.devices}</span>
      </div>
      <UsageBar used={2} limit={limits.devices} label="Dispositivos vinculados" />
    </Card>
  );
}

export function SuscripcionScreen() {
  const session = useSession();
  const owner = isOwner(session.role);
  return (
    <>
      <div>
        <h1 className={pageTitle}>Suscripción</h1>
        <p className={pageSubtitle}>Tu plan, tu consumo y tus comprobantes de pago</p>
      </div>
      <ScreenBody
        state={resolveScreenState({})}
        onRetry={() => undefined}
        empty={{
          title: 'Todavía no hay cobros',
          body: 'Estás en el plan Xangarrito, que es gratis para siempre. Cuando cambies de plan verás aquí tus comprobantes.',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 20,
          }}
        >
          <CurrentPlan owner={owner} />
          <Consumo />
        </div>
        <div className={planGrid}>
          {PLAN_CARDS.map((p) => (
            <PlanCard key={p.id} plan={p} current={p.id === session.planId} />
          ))}
        </div>
        <AsesorBlock tiers={ASESOR_TIERS} />
        <Comprobantes invoices={INVOICES} />
        {owner ? <PauseRow /> : null}
      </ScreenBody>
    </>
  );
}
