'use client';

import { useState } from 'react';
import Link from 'next/link';
import { colors, portalFontSizes } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import { ICONS, OPERADOR_BASE } from '../shell/nav';
import { ListCard, TintBox } from '../ui/parts';
import * as u from '../ui/ui.css';
import { corteChip, cortesNota } from './copy';
import * as s from './inicio.css';
import * as l from './lists.css';
import type { CorteReciente, MensajeDueno, Tarea, TareaTipo } from './types';

const TAREA: Record<TareaTipo, { icon: string; tint: string; cta: string; slug: string }> = {
  gasto: { icon: ICONS.gastos, tint: colors.redSoft, cta: 'Registrar', slug: 'gastos' },
  reponer: {
    icon: ICONS.inventario,
    tint: colors.warningSoft,
    cta: 'Ver stock',
    slug: 'inventario',
  },
  cobrar: {
    icon: ICONS.cobranza,
    tint: colors.blueSoft,
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
export function ParaHoy({ tareas }: { readonly tareas: readonly Tarea[] }) {
  const [hechas, setHechas] = useState<readonly string[]>([]);
  const shown = tareas.filter((t) => !hechas.includes(t.id));
  return (
    <ListCard
      label="Para hoy"
      headBg={colors.gray100}
      count={shown.length}
      note="Lo que nadie ha hecho todavía en tu caja."
    >
      {shown.map((t) => (
        <TareaRow key={t.id} t={t} onSkip={() => setHechas((h) => [...h, t.id])} />
      ))}
      {shown.length === 0 ? <TodoAlDia /> : null}
    </ListCard>
  );
}

function TareaRow({ t, onSkip }: { readonly t: Tarea; readonly onSkip: () => void }) {
  const k = TAREA[t.tipo];
  return (
    <div
      className={`${u.row} ${u.rowWrap}`}
      data-hover=""
      style={{ gap: 13, padding: '14px 18px' }}
    >
      <div className={u.rowMain} style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <TintBox icon={k.icon} tint={k.tint} size={40} glyph={19} />
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          <div
            className={s.rowTitle}
            style={{ fontSize: portalFontSizes.body, letterSpacing: '-0.015em' }}
          >
            {t.titulo}
          </div>
          <div className={s.rowDetail}>{t.detalle}</div>
        </div>
      </div>
      <div style={{ flex: 'none', display: 'flex', gap: 9 }}>
        <Link href={`${OPERADOR_BASE}/${k.slug}`} className={s.rowCta}>
          {k.cta}
        </Link>
        <button
          type="button"
          className={s.hoyNo}
          title="Quitar de la lista de hoy"
          onClick={onSkip}
        >
          Hoy no
        </button>
      </div>
    </div>
  );
}

const CHECK = 'M20 6 9 17l-5-5';

function TodoAlDia() {
  return (
    <div className={l.alDia}>
      <div className={l.alDiaTile}>
        <Icon path={CHECK} size={26} strokeWidth={2.7} />
      </div>
      <div className={l.alDiaTitle}>Todo al día</div>
      <div className={l.alDiaBody}>No hay nada pendiente en tu caja. Sigue cobrando.</div>
    </div>
  );
}

/** «De parte de …»: the owner's latest messages; the dot carries severity. */
export function DeParteDe({
  dueno,
  mensajes,
}: {
  readonly dueno: string;
  readonly mensajes: readonly MensajeDueno[];
}) {
  return (
    <ListCard
      label={`De parte de ${dueno}`}
      headBg={colors.blueSoft}
      link={{ label: 'Ver todos', href: `${OPERADOR_BASE}/avisos` }}
    >
      {mensajes.map((m) => (
        <div
          key={m.id}
          className={u.row}
          data-hover=""
          style={{ alignItems: 'flex-start', gap: 12, padding: '14px 18px' }}
        >
          <span
            className={s.dot}
            style={{ background: m.severidad === 'alta' ? colors.red : colors.yellow }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              className={s.rowTitle}
              style={{ fontSize: portalFontSizes.md, letterSpacing: '-0.01em' }}
            >
              {m.titulo}
            </div>
            <div className={l.msgBody}>{m.cuerpo}</div>
            <div className={l.msgTime}>{m.hora}</div>
          </div>
        </div>
      ))}
    </ListCard>
  );
}

export function UltimosCortes({ cortes }: { readonly cortes: readonly CorteReciente[] }) {
  return (
    <ListCard
      label="Tus últimos cortes"
      headBg={colors.gray100}
      link={{ label: 'Cerrar turno', href: `${OPERADOR_BASE}/cierre` }}
    >
      <div className={l.cortes}>
        {cortes.map((c) => {
          const chip = corteChip(c);
          return (
            <div key={c.etiqueta} className={l.corteRow}>
              <span className={l.corteFecha}>{c.etiqueta}</span>
              <span className={s.chip} style={{ background: chip.bg, color: chip.color }}>
                {chip.label}
              </span>
            </div>
          );
        })}
        <div className={l.cortesNota}>{cortesNota(cortes)}</div>
      </div>
    </ListCard>
  );
}
