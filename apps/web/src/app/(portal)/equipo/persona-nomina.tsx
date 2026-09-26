'use client';

import { formatMoney, salarioSemanal } from '@xangarro/domain';

import { StatusPill } from '@/components';
import type { EmpleadosData } from '@/server/screens';
import { eyebrow } from '@/styles/text.css';

import { NuevoEmpleadoSheet } from '../empleados/sheet';
import { avatar, cardGrid } from './equipo.css';
import { NuevoOperadorDialog } from './operador-dialogs';
import * as s from './personas.css';

type Empleado = EmpleadosData[number];

const iniciales = (n: string) =>
  n
    .split(' ')
    .slice(0, 2)
    .map((w) => w.slice(0, 1))
    .join('');

const semanal = (e: Empleado) => formatMoney(salarioSemanal(e.salario ?? 0n, e.periodo));

/**
 * The payroll half of a person who cobra at the caja (ADR-107): what they are
 * paid, or — for a writer — «Agregar a nómina» with their name already filled.
 */
export function NominaLinea(props: {
  readonly nombre: string;
  readonly empleado: Empleado | null;
  readonly mayWrite: boolean;
}) {
  const e = props.empleado;
  if (e === null) {
    return props.mayWrite ? (
      <div className={s.nomina}>
        <span className={s.nominaSub}>No está en tu nómina.</span>
        <span className={s.empuja}>
          <NuevoEmpleadoSheet nombre={props.nombre} />
        </span>
      </div>
    ) : null;
  }
  return (
    <div className={s.nomina} data-testid="persona-nomina">
      <span>En nómina · {semanal(e)} a la semana</span>
      <span className={s.nominaSub}>{e.puesto}</span>
    </div>
  );
}

/**
 * People on payroll who do not cobra at a caja (ADR-107). A writer can give
 * one access with their name already filled, while the plan has a seat.
 */
export function SoloNomina(props: {
  readonly empleados: readonly Empleado[];
  readonly mayWrite: boolean;
  readonly lleno: boolean;
  readonly limit: number;
}) {
  if (props.empleados.length === 0) return null;
  return (
    <>
      <h2 className={s.seccion}>En nómina, sin caja</h2>
      <div className={cardGrid}>
        {props.empleados.map((e) => (
          <div key={e.id} className={s.tarjeta}>
            <div className={s.cabeza}>
              <span className={avatar} aria-hidden="true">
                {iniciales(e.nombre)}
              </span>
              <span className={s.nombre}>
                {e.nombre}
                <span className={eyebrow}>{e.puesto}</span>
              </span>
              <span className={s.empuja}>
                <StatusPill tone="neutral">No cobra</StatusPill>
              </span>
            </div>
            <div className={s.nomina}>En nómina · {semanal(e)} a la semana</div>
            {props.mayWrite ? (
              <NuevoOperadorDialog
                disabled={props.lleno}
                limit={props.limit}
                nombreInicial={e.nombre}
                label="Darle acceso a la caja"
              />
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}
