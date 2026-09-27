'use client';

import { PLAN_LIMITS, PLAN_NOMBRE, PLAN_IDS, type PlanId } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';
import Link from 'next/link';

import { Icon } from '@/shell/icon';

import * as c from './cobros.css';
import { GLIFO, MetodoCard } from './metodos';
import type { Cobros } from './use-cobros';

/**
 * Fiado is the `ventasCredito` Función (it needs clientes and cobranza, not
 * just a button), shown here because owners look for it among the ways of
 * getting paid. The plan and the platform still gate its switch.
 */
export interface Acceso {
  readonly owner: boolean;
  readonly planId: PlanId;
  /** The platform has released `ventasCredito` (N-09). */
  readonly disponible: boolean;
}

const primerPlan = (): PlanId =>
  PLAN_IDS.find((p) => PLAN_LIMITS[p].features.includes('ventasCredito')) ?? 'xangarro';

/** Not in the plan: the switch becomes the way to the plan that has it. */
function DesdePlan() {
  return (
    <Link href="/suscripcion" className={c.plan}>
      Desde {PLAN_NOMBRE[primerPlan()]}
    </Link>
  );
}

/** While Fiado is on: where new clients land, and its twin in Funciones. */
function FiadoNotas() {
  return (
    <>
      <p className={c.notaAmbar}>
        <span style={{ display: 'flex', color: colors.warningText }}>
          <Icon
            path="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
            size={18}
          />
        </span>
        <span>
          Cada cliente nuevo que se crea en la caja te llega a{' '}
          <Link href="/revision-caja" className={c.enlace}>
            Revisión de caja
          </Link>{' '}
          para que le pongas límite y plazo.
        </span>
      </p>
      <span className={c.pie}>
        <span>
          Es la misma función que{' '}
          <Link href="/negocio/funciones" className={c.enlace}>
            Ventas a crédito
          </Link>{' '}
          en Funciones.
        </span>
      </span>
    </>
  );
}

export function FiadoCard({ k, acceso }: { readonly k: Cobros; readonly acceso: Acceso }) {
  const enPlan = PLAN_LIMITS[acceso.planId].features.includes('ventasCredito');
  const on = k.fiado && acceso.disponible;
  return (
    <MetodoCard
      id="cobro-fiado"
      nombre="Fiado"
      desc={
        acceso.disponible
          ? 'Se lleva hoy y te paga después; queda en su cuenta.'
          : 'Se lleva hoy y te paga después. Todavía no llega a tus cajas.'
      }
      glifo={GLIFO.Fiado}
      fondo={colors.peachSoft}
      on={on}
      error={false}
      puede={acceso.owner && enPlan && acceso.disponible && !k.pending}
      onToggle={k.guardarFiado}
      control={enPlan ? undefined : <DesdePlan />}
    >
      <FiadoNotas />
    </MetodoCard>
  );
}
