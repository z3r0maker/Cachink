import type { ReactNode } from 'react';

import * as s from './aviso.css';

export type AvisoTono = keyof typeof s.avisoTono;

const ICONO: Record<AvisoTono, ReactNode> = {
  success: <path d="M20 6 9 17l-5-5" />,
  warning: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </>
  ),
  critical: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </>
  ),
};

export function AvisoIcono({
  tono,
  size = 20,
}: {
  readonly tono: AvisoTono;
  readonly size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flex: 'none' }}
    >
      {ICONO[tono]}
    </svg>
  );
}

/**
 * A notice in the board's look: tinted, an icon so the tone is never colour
 * alone, and an optional close. Critical ones are alerts; the rest are status.
 */
export function Aviso({
  tono,
  children,
  accion,
  onCerrar,
}: {
  readonly tono: AvisoTono;
  readonly children: ReactNode;
  readonly accion?: ReactNode;
  readonly onCerrar?: () => void;
}) {
  return (
    <div
      className={`${s.aviso} ${s.avisoTono[tono]}`}
      role={tono === 'critical' ? 'alert' : 'status'}
    >
      <AvisoIcono tono={tono} />
      <span className={s.avisoTexto}>{children}</span>
      {accion}
      {onCerrar !== undefined ? (
        <button
          type="button"
          className={s.avisoCerrar}
          aria-label="Cerrar aviso"
          onClick={onCerrar}
        >
          <svg viewBox="0 0 24 24" width={18} height={18} fill="none" aria-hidden="true">
            <path
              d="M18 6 6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

/** The short status pill beside a heading («Saldos guardados»). */
export function Pastilla({
  tono,
  children,
}: {
  readonly tono: AvisoTono;
  readonly children: ReactNode;
}) {
  return (
    <span className={`${s.pill} ${s.avisoTono[tono]}`} role="status">
      <AvisoIcono tono={tono} size={18} />
      <span className={s.pillTexto}>{children}</span>
    </span>
  );
}
