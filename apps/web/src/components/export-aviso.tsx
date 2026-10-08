'use client';

import { useEffect } from 'react';

import * as s from './export-aviso.css';

const trazo = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  'aria-hidden': true,
} as const;

/** The toast an export shows when no file came (DS-02): one sentence and a close button. */
export function ExportAviso({
  texto,
  onClose,
}: {
  readonly texto: string;
  readonly onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div role="alert" className={s.aviso}>
      <span className={s.icono}>
        <svg {...trazo} width={16} height={16} strokeWidth={2.6}>
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </span>
      <span className={s.texto}>{texto}</span>
      <button type="button" className={s.cerrar} aria-label="Cerrar aviso" onClick={onClose}>
        <svg {...trazo} width={18} height={18} strokeWidth={2.4}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
