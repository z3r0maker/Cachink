'use client';

import { useEffect } from 'react';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as t from './toast.css';

const CHECK = 'M20 6 9 17l-5-5';
const CERRAR = 'M18 6 6 18M6 6l12 12';

/** Wi-Fi crossed out: «Sin internet: se guardó y se envía al volver». */
export const ICONO_SIN_RED =
  'M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M5 12.86a10 10 0 0 1 5.17-2.69M2 8.82a15 15 0 0 1 4.18-2.65M22 8.82a15 15 0 0 0-11.29-3.76M19 12.86a10 10 0 0 0-2-1.54M2 2l20 20';

export interface ToastProps {
  readonly title: string;
  readonly body: string;
  /** Head tint; the icon is green-text on green, amber on amber, black otherwise. */
  readonly tint?: string;
  /** 380 px in Avisos, 360 in Ventas, Gastos and Caja. */
  readonly width?: 360 | 380;
  /** The icon's colour when the tint's default does not fit. */
  readonly check?: string;
  /** Lucide path; a check by default, `ICONO_SIN_RED` for the offline notice. */
  readonly icon?: string;
  readonly onClose: () => void;
}

function colorDe(tint: string): string {
  if (tint === colors.greenSoft) return colors.greenText;
  if (tint === colors.warningSoft) return colors.warningText;
  return colors.black;
}

/** Bottom-right quick notice (OpEstados); the X or Esc dismisses it. */
export function Toast({
  title,
  body,
  tint = colors.greenSoft,
  width = 380,
  check,
  icon = CHECK,
  onClose,
}: ToastProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div role="status" className={t.toast} style={{ width: `min(${width}px, calc(100vw - 32px))` }}>
      <div className={t.head} style={{ background: tint }}>
        <span className={t.icon} style={{ color: check ?? colorDe(tint) }}>
          <Icon path={icon} size={16} strokeWidth={2.6} />
        </span>
        <span className={t.title}>{title}</span>
        <button
          type="button"
          className={t.close}
          aria-label={`Cerrar aviso: ${title}`}
          onClick={onClose}
        >
          <Icon path={CERRAR} size={18} strokeWidth={2.4} />
        </button>
      </div>
      <p className={t.body}>{body}</p>
    </div>
  );
}
