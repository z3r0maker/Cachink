import { colors } from '@xangarro/tokens';
import type { ReactNode } from 'react';

import { Don, type DonPose } from '@/components';

import {
  columna,
  marca,
  monedaMarca,
  panel,
  rejilla,
  subtitulo,
  titular,
} from '../login/aside.css';
import { escena, pie, tope } from './marco.css';

/**
 * The public pages' frame (signup, activar, ARCO): the same two columns as
 * `/login` (P-02), the yellow panel on the left with the wordmark, one Don
 * Cuentas pose and a headline, the page's content on the right. Below 1024 px
 * the panel shrinks to a band above the content, like the login's.
 */
export interface MarcoPublicoProps {
  readonly pose: DonPose;
  readonly titulo: string;
  readonly bajada: string;
  /** Under the headline: a short checklist or a chip. Hidden on phones. */
  readonly extra?: ReactNode;
  readonly children: ReactNode;
}

function Marca() {
  return (
    <div className={tope}>
      <span className={marca}>XANGARRO!</span>
      <span className={monedaMarca} aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width="60%"
          height="60%"
          fill="none"
          stroke="currentColor"
          strokeWidth={4.6}
          strokeLinecap="butt"
          style={{ color: colors.black }}
        >
          <path d="M5 5l14 14M19 5 5 19" />
        </svg>
      </span>
    </div>
  );
}

export function MarcoPublico({ pose, titulo, bajada, extra, children }: MarcoPublicoProps) {
  return (
    <div className={rejilla}>
      <aside className={panel} data-testid="panel-publico">
        <Marca />
        <div className={escena}>
          <Don pose={pose} size={380} />
        </div>
        <div className={pie}>
          <p className={titular}>{titulo}</p>
          <p className={subtitulo}>{bajada}</p>
          {extra}
        </div>
      </aside>
      <main className={columna}>{children}</main>
    </div>
  );
}
