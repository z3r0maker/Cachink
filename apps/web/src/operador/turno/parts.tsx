import Link from 'next/link';
import { colors, portalFontSizes } from '@xangarro/tokens';
import { formatMoney } from '@xangarro/domain';

import { Icon } from '../../shell/icon';
import { enPalabras } from '../inicio/copy';
import { ICONS, OPERADOR_BASE } from '../shell/nav';
import { hintCanceladas, hintComprobantes } from '../ui/frases';
import type { KpiItem } from '../ui/parts';
import * as u from '../ui/ui.css';
import type { TurnoData } from './types';

/** The four turno figures. */
export function kpis(d: TurnoData): readonly KpiItem[] {
  const cancelada = hintCanceladas(d.canceladas, d.ultimaCancelada);
  const comprobantes = hintComprobantes(d.comprobantes);
  return [
    { label: 'Ventas del turno', value: String(d.ventas), color: colors.black, hint: cancelada },
    {
      label: 'Cobrado',
      value: formatMoney(d.cobrado),
      color: colors.greenText,
      hint: 'Todos los métodos',
    },
    {
      label: 'Fiado',
      value: formatMoney(d.fiado),
      color: colors.warningText,
      hint: `${enPalabras(d.clientesFiados)} clientes`,
    },
    { label: 'Gastos', value: formatMoney(d.gastos), color: colors.redText, hint: comprobantes },
  ];
}

const ATAJOS = [
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
    label: 'Ventas del turno',
    hint: 'Revisar o cancelar',
    slug: 'ventas',
    bg: colors.white,
    icon: ICONS.ventas,
  },
] as const;

/** Turno's shortcut cards: larger than Inicio's (104 px, 40 px tile, 16 px label). */
export function Atajos() {
  return (
    <div
      className={u.kpiGrid}
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}
    >
      {ATAJOS.map((a) => (
        <Link
          key={a.slug}
          href={`${OPERADOR_BASE}/${a.slug}`}
          className={u.shortcut}
          style={{ background: a.bg, minHeight: 104, gap: 9 }}
        >
          <span className={u.tintBox} style={{ width: 40, height: 40, background: colors.white }}>
            <Icon path={a.icon} size={20} strokeWidth={2.3} />
          </span>
          <span className={u.shortcutLabel} style={{ fontSize: portalFontSizes.lg }}>
            {a.label}
          </span>
          <span className={u.shortcutHint} style={{ fontSize: portalFontSizes.sm }}>
            {a.hint}
          </span>
        </Link>
      ))}
    </div>
  );
}
