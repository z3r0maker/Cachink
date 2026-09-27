'use client';

import {
  FEATURE_FLAG_DEPENDENCIES,
  PLAN_IDS,
  PLAN_LIMITS,
  PLAN_NOMBRE,
  type FeatureFlagKey,
} from '@xangarro/domain';
import Link from 'next/link';

import { Switch } from '@/components';
import type { FlagRow } from '@/data/negocio';
import { Icon } from '@/shell/icon';

import { FUNCION } from './copy';
import * as f from './funciones.css';

/**
 * One Función (P-15): plan, estado and its switch. The switch exists only
 * where the platform released it and the plan includes it; a child whose
 * parent is off stays locked, with the reason under its name.
 */
const primerPlan = (key: FeatureFlagKey) =>
  PLAN_NOMBRE[PLAN_IDS.find((p) => PLAN_LIMITS[p].features.includes(key)) ?? 'xangarrote'];

function nota(
  r: FlagRow,
  padreOn: boolean | null,
): { texto: string; tono: 'gris' | 'ambar' } | null {
  const padre = FEATURE_FLAG_DEPENDENCIES[r.key];
  if (!r.disponible) return { texto: 'Todavía no llega a tus cajas.', tono: 'gris' };
  if (padre && padreOn === false && r.enTuPlan)
    return { texto: `Prende ${FUNCION[padre].nombre} para usarla.`, tono: 'ambar' };
  if (r.key === 'ventasCredito') return { texto: 'En Cobros aparece como Fiado.', tono: 'gris' };
  return null;
}

function Chips({ r }: { readonly r: FlagRow }) {
  const on = r.activada ? 'on' : 'off';
  return (
    <span className={f.chips}>
      {r.enTuPlan ? (
        <span className={f.pill.plan}>En tu plan</span>
      ) : (
        <Link href="/suscripcion" className={f.pill.upsell}>
          Desde {primerPlan(r.key)}
        </Link>
      )}
      <span className={f.pill[on]}>
        <span className={f.punto[on]} aria-hidden="true" />
        {r.activada ? 'Prendida' : 'Apagada'}
      </span>
    </span>
  );
}

export function FuncionFila(props: {
  readonly r: FlagRow;
  readonly padreOn: boolean | null;
  readonly mayWrite: boolean;
  readonly onToggle: (key: FeatureFlagKey, on: boolean) => void;
}) {
  const { r } = props;
  const c = FUNCION[r.key];
  const n = nota(r, props.padreOn);
  const locked = props.padreOn === false;
  return (
    <div className={f.fila}>
      <span className={f.colNombre}>
        <span className={f.tile} style={{ background: c.fondo }} aria-hidden="true">
          <Icon path={c.icono} size={20} strokeWidth={2.1} />
        </span>
        <span className={f.nombreTexto}>
          <span className={f.nombre}>{c.nombre}</span>
          <span className={f.desc}>{c.desc}</span>
          {n ? <span className={f.nota[n.tono]}>{n.texto}</span> : null}
        </span>
      </span>
      <Chips r={r} />
      <span className={f.colControl}>
        {r.disponible && r.enTuPlan ? (
          <Switch
            checked={r.activada}
            label={c.nombre}
            disabled={!props.mayWrite || (locked && !r.activada)}
            onCheckedChange={(on) => props.onToggle(r.key, on)}
          />
        ) : null}
      </span>
    </div>
  );
}
