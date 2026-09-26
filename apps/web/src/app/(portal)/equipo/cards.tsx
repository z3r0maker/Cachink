'use client';

import { formatFechaHora, formatMoney } from '@xangarro/domain';
import { useState } from 'react';

import { Card, StatusPill, Tag, type Tone as PillTone } from '@/components';
import { useSession } from '@/session/provider';
import type { EmpleadosData, EquipoData } from '@/server/screens';
import { canWrite } from '@/session/gating';

import { OperadorActions } from './operador-actions';
import { OperadorDetalle } from './operador-drawer';
import { NominaLinea } from './persona-nomina';
import {
  avatar,
  cardFoot,
  cardGrid,
  cardHead,
  cardName,
  statBox,
  statBoxes,
  statLabel,
  statValue,
} from './equipo.css';

const initials = (n: string) =>
  n
    .split(' ')
    .slice(0, 2)
    .map((w) => w.slice(0, 1))
    .join('');

/** Permissions are stored as JSON; a malformed value must not crash a card. */
function canCancel(permissions: unknown): boolean {
  try {
    const p = typeof permissions === 'string' ? JSON.parse(permissions) : permissions;
    return Boolean((p as { canCancelSales?: boolean } | null)?.canCancelSales);
  } catch {
    return false;
  }
}

type Operador = EquipoData['operadores'][number];
type Empleado = EmpleadosData[number];

/**
 * The shift pill the design puts on every operator card (C-3). Ours drew an
 * «Inactivo» pill and nothing else, so an operator who had never opened a
 * shift looked exactly like one mid-turn.
 */
const TURNO: Record<Operador['estadoTurno'], { readonly tone: PillTone; readonly label: string }> =
  {
    abierto: { tone: 'success', label: 'Turno abierto' },
    cerrado: { tone: 'neutral', label: 'Turno cerrado' },
    sin_vincular: { tone: 'warning', label: 'Sin vincular' },
  };

/** «Capturó hoy» and «Cobrado hoy» — the design's two inset boxes (C-2). */
function StatBoxes({ o }: { readonly o: Operador }) {
  return (
    <div className={statBoxes}>
      <div className={statBox}>
        <div className={statLabel}>Capturó hoy</div>
        <div className={statValue}>{o.capturoHoy}</div>
      </div>
      <div className={statBox}>
        <div className={statLabel}>Cobrado hoy</div>
        <div className={statValue}>{formatMoney(o.cobradoHoy)}</div>
      </div>
    </div>
  );
}

function Encabezado({
  o,
  turno,
}: {
  readonly o: Operador;
  readonly turno: (typeof TURNO)[keyof typeof TURNO];
}) {
  return (
    <div className={cardHead}>
      <span className={avatar} aria-hidden="true">
        {initials(o.nombre ?? '')}
      </span>
      <strong className={cardName}>{o.nombre}</strong>
      <StatusPill tone={turno.tone}>{turno.label}</StatusPill>
      {o.active ? null : <StatusPill tone="neutral">Inactivo</StatusPill>}
    </div>
  );
}

/** The footer names the device and when it was last seen, which is what an
 *  owner asks when an operator's rows stop arriving. */
function Pie({ o }: { readonly o: Operador }) {
  return (
    <p className={cardFoot}>
      {o.dispositivo === null
        ? 'Todavía no entra desde ninguna caja.'
        : `${o.dispositivo} · último turno ${formatFechaHora(o.ultimoTurnoAt)}`}
    </p>
  );
}

function OperadorCard(props: {
  readonly o: Operador;
  readonly empleado: Empleado | null;
  readonly mayWrite: boolean;
  readonly showPerms: boolean;
  readonly onWarning: (w: string | null) => void;
}) {
  const { o, showPerms } = props;
  const turno = TURNO[o.estadoTurno];
  return (
    <Card>
      <Encabezado o={o} turno={turno} />
      {showPerms && canCancel(o.permissions) ? (
        <div style={{ marginTop: 14 }}>
          <Tag tone="success">Puede cancelar ventas</Tag>
        </div>
      ) : null}
      <StatBoxes o={o} />
      <NominaLinea
        nombre={o.nombre ?? ''}
        empleado={props.empleado}
        mayWrite={props.mayWrite && o.active}
      />
      <Pie o={o} />
      <OperadorDetalle id={o.id} nombre={o.nombre ?? ''} />
      {props.mayWrite && o.active ? (
        <OperadorActions
          id={o.id}
          nombre={o.nombre ?? ''}
          onWarning={props.onWarning}
          permisos={showPerms ? { canCancelSales: canCancel(o.permissions) } : null}
        />
      ) : null}
    </Card>
  );
}

/** Every operator as a person (ADR-107): their caja, and their line on payroll. */
export function Operadores({
  personas,
}: {
  readonly personas: ReadonlyArray<{
    readonly operador: Operador;
    readonly empleado: Empleado | null;
  }>;
}) {
  const session = useSession();
  const mayWrite = canWrite(session.role);
  const showPerms = session.capabilities.permisosPorUsuario && mayWrite;
  const [warning, setWarning] = useState<string | null>(null);
  return (
    <>
      {warning === null ? null : (
        <p role="status" data-testid="operador-warning">
          {warning}
        </p>
      )}
      <div className={cardGrid}>
        {personas.map(({ operador: o, empleado }) => (
          <OperadorCard
            key={o.id}
            o={o}
            empleado={empleado}
            mayWrite={mayWrite}
            showPerms={showPerms}
            onWarning={setWarning}
          />
        ))}
      </div>
    </>
  );
}
