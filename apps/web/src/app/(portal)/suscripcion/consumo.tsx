'use client';

import { PLAN_LIMITS } from '@xangarro/domain';

import type { SuscripcionData } from '@/server/suscripcion';
import { useSession } from '@/session/provider';

import * as r from './resumen.css';
import { eyebrow } from './suscripcion.css';

/**
 * «Tu consumo este mes». Every number is the business's own; a counter not
 * computed yet reads «sin dato» and draws an empty bar. A full allowance says
 * «Al tope» in words beside the amber bar.
 */
const cifra = (n: number) => n.toLocaleString('es-MX');

function Metrica(props: {
  readonly nombre: string;
  readonly usados: number | null;
  readonly limite: number;
}) {
  const usados = props.usados ?? 0;
  const tope = props.usados !== null && usados >= props.limite;
  const ratio = props.limite > 0 ? Math.min(usados / props.limite, 1) : 0;
  return (
    <div className={r.metrica}>
      <div className={r.metricaHead}>
        <span className={r.metricaNombre}>{props.nombre}</span>
        {tope ? <span className={r.alTope}>Al tope</span> : null}
        <span className={r.metricaCifra}>
          {props.usados === null ? 'sin dato' : cifra(usados)}{' '}
          <span className={r.metricaDe}>de {cifra(props.limite)}</span>
        </span>
      </div>
      <div
        className={r.barra}
        role="progressbar"
        aria-label={props.nombre}
        aria-valuenow={usados}
        aria-valuemin={0}
        aria-valuemax={props.limite}
      >
        <span
          className={tope ? r.barraLlena.tope : r.barraLlena.normal}
          style={{ width: `${Math.max(ratio * 100, props.usados === null ? 0 : 2)}%` }}
        />
      </div>
    </div>
  );
}

export function Consumo({ uso }: { readonly uso: SuscripcionData['uso'] }) {
  const limits = PLAN_LIMITS[useSession().planId];
  return (
    <section className={r.panel} aria-labelledby="uso-t">
      <h2 id="uso-t" className={eyebrow}>
        Tu consumo este mes
      </h2>
      <Metrica nombre="Operadores" usados={uso.operadores} limite={limits.operators} />
      <Metrica
        nombre="Transacciones del mes"
        usados={uso.registros}
        limite={limits.transactionsPerMonth}
      />
      <Metrica nombre="Productos activos" usados={uso.productos} limite={limits.activeProducts} />
      <Metrica nombre="Cajas conectadas" usados={uso.dispositivos} limite={limits.devices} />
    </section>
  );
}
