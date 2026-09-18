'use client';

import { useEffect } from 'react';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as t from './toast.css';

const CHECK = 'M20 6 9 17l-5-5';

export interface ToastProps {
  readonly title: string;
  readonly body: string;
  /** Head tint; the check is green-text on green, black on any other tint. */
  readonly tint?: string;
  /** 380 px in Avisos, 360 in Ventas, Gastos and Caja. */
  readonly width?: 360 | 380;
  /** Inventario draws the check black on every tint. */
  readonly check?: string;
  readonly onClose: () => void;
}

/** Bottom-right confirmation; «Entendido» or Esc dismisses it. */
export function Toast({
  title,
  body,
  tint = colors.greenSoft,
  width = 380,
  check,
  onClose,
}: ToastProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const checkColor = check ?? (tint === colors.greenSoft ? colors.greenText : colors.black);
  return (
    <div role="status" className={t.toast} style={{ width: `min(${width}px, calc(100vw - 32px))` }}>
      <div className={t.head} style={{ background: tint }}>
        <span style={{ color: checkColor, display: 'grid' }}>
          <Icon path={CHECK} size={20} strokeWidth={2.6} />
        </span>
        <span className={t.title}>{title}</span>
      </div>
      <div className={t.body}>
        <div className={t.text}>{body}</div>
        <button type="button" className={t.ok} onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}
