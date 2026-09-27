'use client';

import Link from 'next/link';
import { colors } from '@xangarro/tokens';

import { ICONS, OPERADOR_BASE } from '@xangarro/caja';
import { Chip, Panel, Tile } from '../ui/panel';
import * as p from '../ui/panel.css';
import { useHoyNo } from '../ui/hoy-no';
import {
  corteChip,
  MAX_TAREAS,
  type CorteReciente,
  type MensajeDueno,
  type Tarea,
  type TareaTipo,
} from '@xangarro/caja/inicio';
import * as s from './inicio.css';
import * as l from './lists.css';

const TAREA: Record<TareaTipo, { icon: string; tint: string; cta: string; slug: string }> = {
  gasto: { icon: ICONS.gastos, tint: colors.redSoft, cta: 'Registrar', slug: 'gastos' },
  reponer: {
    icon: ICONS.inventario,
    tint: colors.yellowSoft,
    cta: 'Ver stock',
    slug: 'inventario',
  },
  cobrar: {
    icon: ICONS.cobranza,
    tint: colors.warningSoft,
    cta: 'Recibir abono',
    slug: 'cobranza',
  },
  entrada: {
    icon: ICONS.inventario,
    tint: colors.greenSoft,
    cta: 'Registrar',
    slug: 'inventario',
  },
};

/** «Para hoy»: what nobody on this register has done yet; «Hoy no» hides a row for today. */
export function ParaHoy({
  tareas,
  cerrado,
}: {
  readonly tareas: readonly Tarea[];
  /** With no turno open, the list waits for it. */
  readonly cerrado: boolean;
}) {
  const hoyNo = useHoyNo();
  // The most urgent few still standing: a row put off makes room for the next.
  const shown = tareas.filter((t) => !hoyNo.ocultos.includes(t.id)).slice(0, MAX_TAREAS);
  if (cerrado) return <ParaHoyCerrado />;
  const verTodas = tareas.some((t) => hoyNo.ocultos.includes(t.id)) ? (
    <button type="button" className={s.verTodas} onClick={hoyNo.mostrarTodo}>
      Ver todas
    </button>
  ) : null;
  return (
    <Panel
      label="Para hoy"
      count={shown.length}
      note="Lo que nadie ha hecho todavía en tu caja"
      action={verTodas}
    >
      {shown.map((t) => (
        <TareaRow key={t.id} t={t} onSkip={() => hoyNo.ocultar(t.id)} />
      ))}
      {shown.length === 0 ? (
        <div className={s.nada}>
          <span className={s.nadaTitle}>Nada más para hoy</span>
          <span className={p.rowDetail}>Lo que dejaste para después vuelve a salir mañana.</span>
        </div>
      ) : null}
    </Panel>
  );
}

function ParaHoyCerrado() {
  return (
    <Panel label="Para hoy">
      <div className={s.nada}>
        <span className={s.nadaTitle}>Tus pendientes salen al abrir el turno</span>
        <span className={p.rowDetail}>
          Gastos que se repiten, stock bajo y clientes por cobrar.
        </span>
      </div>
    </Panel>
  );
}

function TareaRow({ t, onSkip }: { readonly t: Tarea; readonly onSkip: () => void }) {
  const k = TAREA[t.tipo];
  return (
    <div className={s.tarea}>
      <Tile icon={k.icon} tint={k.tint} />
      <span className={s.tareaText}>
        <span className={p.rowTitle}>{t.titulo}</span>
        <span className={p.rowDetail}>{t.detalle}</span>
      </span>
      <span className={s.tareaActions}>
        <Link href={t.href ?? `${OPERADOR_BASE}/${k.slug}`} className={p.outlineBtn}>
          {k.cta}
        </Link>
        <button
          type="button"
          className={p.quietBtn}
          title="Quitar de la lista de hoy"
          aria-label={`Hoy no: ${t.titulo}`}
          onClick={onSkip}
        >
          Hoy no
        </button>
      </span>
    </div>
  );
}

/** «De parte de …»: the owner's latest messages; the urgent one is tinted red. */
export function DeParteDe({
  dueno,
  mensajes,
}: {
  readonly dueno: string;
  readonly mensajes: readonly MensajeDueno[];
}) {
  const avisos = `${OPERADOR_BASE}/avisos`;
  const link = (
    <Link href={avisos} className={p.headLink}>
      Ver todos
    </Link>
  );
  return (
    <Panel label={`De parte de ${dueno}`} action={link}>
      <div className={l.mensajes}>
        {mensajes.map((m) => (
          <Link
            key={m.id}
            href={avisos}
            className={m.severidad === 'alta' ? `${l.mensaje} ${l.mensajeAlta}` : l.mensaje}
          >
            <span className={`${l.dotBase} ${l.dot[m.severidad]}`} aria-hidden="true" />
            <span className={l.mensajeText}>
              <span className={p.rowTitle}>{m.titulo}</span>
              <span className={p.rowDetail}>{m.cuerpo}</span>
              <span className={l.mensajeHora} data-alta={m.severidad === 'alta' ? '' : undefined}>
                {m.hora}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </Panel>
  );
}

export function UltimosCortes({ cortes }: { readonly cortes: readonly CorteReciente[] }) {
  const link = (
    <Link href={`${OPERADOR_BASE}/cierre`} className={p.headLink}>
      Cerrar turno
    </Link>
  );
  return (
    <Panel label="Tus últimos cortes" action={link}>
      <div className={l.cortes}>
        {cortes.map((c) => {
          const chip = corteChip(c);
          return (
            <div key={c.etiqueta} className={l.corte}>
              <span className={l.corteFecha}>{c.etiqueta}</span>
              <Chip label={chip.label} color={chip.color} bg={chip.bg} />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
