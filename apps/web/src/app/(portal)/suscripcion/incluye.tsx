'use client';

import { PLAN_IDS, PLAN_LIMITS, PLAN_NOMBRE, type PlanId, type PlanLimits } from '@xangarro/domain';

import { useSession } from '@/session/provider';

import { IconoCheck, IconoGuion } from './iconos';
import * as r from './resumen.css';
import { eyebrow } from './suscripcion.css';

/**
 * «Tu plan incluye»: what comes with the plan and cannot be switched here
 * (ADR-059). Read from PLAN_LIMITS, so moving a capability between plans moves
 * it here too; what the plan lacks names the first plan that has it.
 */
interface Capacidad {
  readonly label: string;
  readonly tiene: (l: PlanLimits) => boolean;
}

const CAPACIDADES: readonly Capacidad[] = [
  { label: 'Inventario y código de barras', tiene: (l) => l.features.includes('stock') },
  { label: 'Ventas a crédito (fiado)', tiene: (l) => l.features.includes('ventasCredito') },
  { label: 'Estados financieros NIF', tiene: (l) => l.capabilities.estadosFinancieros },
  { label: 'Informe mensual PDF', tiene: (l) => l.capabilities.informeMensual },
  { label: 'Don Cuentas: avisos diarios', tiene: (l) => l.capabilities.asesor !== 'semanal' },
  { label: 'Permisos por usuario', tiene: (l) => l.capabilities.permisosPorUsuario },
];

const desde = (c: Capacidad): PlanId | undefined => PLAN_IDS.find((id) => c.tiene(PLAN_LIMITS[id]));

function Fila({ c, plan }: { readonly c: Capacidad; readonly plan: PlanId }) {
  if (c.tiene(PLAN_LIMITS[plan])) {
    return (
      <li className={r.incluyeFila}>
        <span className={r.check}>
          <IconoCheck />
        </span>
        {c.label}
      </li>
    );
  }
  const primero = desde(c);
  return (
    <li className={`${r.incluyeFila} ${r.incluyeNo}`}>
      <IconoGuion />
      {c.label}
      {primero ? <span className={r.desde}>Desde {PLAN_NOMBRE[primero]}</span> : null}
    </li>
  );
}

export function Incluye() {
  const { planId } = useSession();
  return (
    <section className={r.panel} aria-labelledby="inc-t">
      <h2 id="inc-t" className={eyebrow}>
        Tu plan incluye
      </h2>
      <p className={r.incluyeNota}>Viene con tu plan; no se prende ni se apaga aquí.</p>
      <ul className={r.incluyeLista}>
        {CAPACIDADES.map((c) => (
          <Fila key={c.label} c={c} plan={planId} />
        ))}
      </ul>
    </section>
  );
}
