'use client';

import { PLAN_NOMBRE } from '@xangarro/domain';

import { ScreenBody } from '@/components';
import { ASESOR_TIERS } from '@/data/planes';
import type { ListarFacturasResult } from '@/server/billing/facturas-core';
import type { SuscripcionData } from '@/server/suscripcion';
import { canWrite, isOwner, resolveScreenState } from '@/session/gating';
import { useSession } from '@/session/provider';

import { MiNegocioHead } from '../negocio/hub';
import { AvisoPago } from './aviso';
import { Consumo } from './consumo';
import { estadoCopy, estadoTono } from './estado';
import { Facturas } from './facturas';
import { fechaLarga } from './fecha';
import { PlanHero } from './hero';
import { Incluye } from './incluye';
import { AsesorBlock, PauseRow } from './parts';
import { Planes } from './planes';
import { fila } from './resumen.css';
import { recibe } from './suscripcion.css';

/**
 * Mi negocio · Plan y pagos (CfgPlan, P-10): your plan, what you use of it,
 * what it includes, the plans, Don Cuentas per plan, the facturas and, for a
 * subscriber, the pause. Past due and lapsed lead with Don and the fix.
 */
function Contenido(props: {
  readonly data: SuscripcionData;
  readonly facturas: ListarFacturasResult;
  readonly owner: boolean;
}) {
  const { data, owner } = props;
  const mayWrite = canWrite(useSession().role);
  const aviso = estadoCopy(data.estado).aviso;
  const tono = estadoTono(data.estado);
  return (
    <>
      {aviso !== null && (tono === 'atrasado' || tono === 'vencido') ? (
        <AvisoPago aviso={aviso} tono={tono} owner={owner} />
      ) : null}
      <div className={fila}>
        <PlanHero owner={owner} data={data} />
        <Consumo uso={data.uso} />
        <Incluye />
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
      <p className={recibe} data-testid="entitlement-debug">
        Tus cajas reciben el plan {PLAN_NOMBRE[data.recibe.plan]}, válido hasta el{' '}
        {fechaLarga(data.recibe.validUntil)}.
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
      <MiNegocioHead activo="plan" />
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
