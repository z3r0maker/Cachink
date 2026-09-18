import { colors } from '@xangarro/tokens';
import Link from 'next/link';

import { Icon } from '../../shell/icon';
import { OperadorEstado } from '../estado';
import { ICONS, OPERADOR_BASE } from '../shell/nav';
import { KpiRow, OpMain } from '../ui/parts';
import * as u from '../ui/ui.css';
import { heroFor, type Hero } from './copy';
import * as s from './inicio.css';
import { kpisFor } from './kpis';
import { DeParteDe, ParaHoy, UltimosCortes } from './lists';
import type { InicioScreenProps } from './types';

/**
 * Operador · Inicio — not a dashboard: it answers «what do I do now».
 * Presentational (ADR-058 §9); the shared states replace «Para hoy» only.
 */
export function InicioScreen({ state, data }: InicioScreenProps) {
  const abierto = data.situacion !== 'turno-cerrado' && data.turno !== null;
  return (
    <OpMain top={24}>
      <div>
        <h1 className={s.h1}>
          {abierto ? `Buenas tardes, ${data.nombre}` : `Buen día, ${data.nombre}`}
        </h1>
        <div className={s.fecha}>{data.fecha}</div>
      </div>
      <HeroCard hero={heroFor(data)} />
      <KpiRow items={kpisFor(data)} min={210} valueSize={30} />
      <div className={s.columns}>
        {state === 'happy' ? (
          <ParaHoy tareas={data.tareas} />
        ) : (
          <OperadorEstado
            mode={state}
            icon={ICONS.inicio}
            emptyTitle="Nada pendiente para hoy"
            emptyBody="Ni gastos recurrentes, ni productos por reponer, ni clientes atrasados. Sigue cobrando."
            errorTitle="No pudimos cargar tus pendientes"
          />
        )}
        <div className={s.side}>
          <DeParteDe dueno={data.dueno} mensajes={data.mensajes} />
          <UltimosCortes cortes={data.cortes} />
        </div>
      </div>
      <Accesos />
    </OpMain>
  );
}

function HeroCard({ hero }: { readonly hero: Hero }) {
  return (
    <div className={s.hero} style={{ background: hero.bg }}>
      <span className={s.heroIcon}>
        <Icon path={hero.icon} size={28} strokeWidth={2.4} />
      </span>
      <div className={s.heroText}>
        <div className={u.eyebrow}>{hero.eyebrow}</div>
        <div className={s.heroTitle}>{hero.title}</div>
        <div className={s.heroBody}>{hero.body}</div>
      </div>
      <Link
        href={hero.href}
        className={s.heroCta}
        style={{ background: hero.ctaBg }}
        data-onyellow=""
      >
        {hero.cta}
      </Link>
    </div>
  );
}

const ACCESOS = [
  {
    label: 'Registrar gasto',
    hint: 'Caja chica con comprobante',
    slug: 'gastos',
    bg: colors.redSoft,
    icon: ICONS.gastos,
  },
  {
    label: 'Inventario',
    hint: 'Entradas y mermas',
    slug: 'inventario',
    bg: colors.greenSoft,
    icon: ICONS.inventario,
  },
  {
    label: 'Cobranza',
    hint: 'Recibir un abono',
    slug: 'cobranza',
    bg: colors.blueSoft,
    icon: ICONS.cobranza,
  },
  {
    label: 'Cierre de turno',
    hint: 'Contar y cerrar',
    slug: 'cierre',
    bg: colors.white,
    icon: ICONS.turno,
  },
] as const;

function Accesos() {
  return (
    <div
      className={u.kpiGrid}
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
    >
      {ACCESOS.map((a) => (
        <Link
          key={a.slug}
          href={`${OPERADOR_BASE}/${a.slug}`}
          className={u.shortcut}
          style={{ background: a.bg, minHeight: 96, gap: 8 }}
        >
          <span className={u.tintBox} style={{ width: 38, height: 38, background: colors.white }}>
            <Icon path={a.icon} size={19} strokeWidth={2.3} />
          </span>
          <span className={u.shortcutLabel}>{a.label}</span>
          <span className={u.shortcutHint}>{a.hint}</span>
        </Link>
      ))}
    </div>
  );
}
