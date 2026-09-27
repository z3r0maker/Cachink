'use client';

import { colors } from '@xangarro/tokens';
import type { ReactNode } from 'react';

import { Switch } from '@/components';
import { Icon } from '@/shell/icon';

import * as c from './cobros.css';

/** The glyphs CfgCobros draws for each way of getting paid. */
export const GLIFO = {
  Efectivo:
    'M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm8 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM6 12h.01M18 12h.01',
  Transferencia: 'M8 3 4 7l4 4M4 7h16m-4 14 4-4-4-4m4 4H4',
  Tarjeta: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm-2 5h20M6 15h4',
  Fiado:
    'M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4M2 6h4M2 10h4M2 14h4M2 18h4M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z',
  alerta: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM12 8v4M12 16h.01',
} as const;

export const ULTIMO =
  'Deja al menos una forma de cobro prendida; sin ella la caja no puede cobrar.';

/**
 * One way of getting paid: its glyph, name, what it means at the caja, and
 * the switch. `control` replaces the switch when the owner can't use it
 * (not in the plan, not released yet); `children` shows only while it is on.
 */
export interface MetodoProps {
  readonly id: string;
  readonly nombre: string;
  readonly desc: string;
  readonly glifo: string;
  readonly fondo: string;
  readonly on: boolean;
  readonly error: boolean;
  readonly puede: boolean;
  readonly onToggle: (on: boolean) => void;
  readonly control?: ReactNode;
  readonly children?: ReactNode;
}

function Cabeza({ p }: { readonly p: MetodoProps }) {
  const estado = p.on ? 'on' : 'off';
  return (
    <div className={c.cardFila}>
      <span className={c.icono} style={{ background: p.fondo }} aria-hidden="true">
        <Icon path={p.glifo} size={24} strokeWidth={2.1} />
      </span>
      <span className={c.cardTexto}>
        <span className={c.cardTitulo}>
          <h3 id={p.id} className={c.nombre}>
            {p.nombre}
          </h3>
          <span className={c.tag[estado]}>{p.on ? 'La caja lo ofrece' : 'Apagado'}</span>
        </span>
        <span className={c.desc}>{p.desc}</span>
      </span>
      <span className={c.control}>
        {p.control ?? (
          <Switch
            checked={p.on}
            label={`Aceptar ${p.nombre.toLowerCase()}`}
            disabled={!p.puede}
            onCheckedChange={p.onToggle}
          />
        )}
      </span>
    </div>
  );
}

export function MetodoCard(p: MetodoProps) {
  return (
    <section
      className={c.card[p.on ? 'on' : 'off']}
      aria-labelledby={p.id}
      data-error={p.error ? '' : undefined}
    >
      <Cabeza p={p} />
      {p.error ? (
        <p role="alert" className={c.alerta}>
          <span style={{ display: 'flex', color: colors.redText }}>
            <Icon path={GLIFO.alerta} size={18} strokeWidth={2.4} />
          </span>
          {ULTIMO}
        </p>
      ) : null}
      {p.on && p.children ? <div className={c.abierto}>{p.children}</div> : null}
    </section>
  );
}
