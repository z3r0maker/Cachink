'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Icon } from '../shell/icon';
import * as s from './estado.css';

export type EstadoMode = 'loading' | 'empty' | 'error';

/** The design's default glyph: Lucide's shopping-cart outline. */
const CART = 'M3 6h2l2.4 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L21 9H6';
const ALERT = 'M12 8v4M12 16h.01';
const SKELETON_ROWS = [1, 2, 3, 4, 5] as const;

export interface OperadorEstadoProps {
  readonly mode: EstadoMode;
  /** Lucide path for the empty tile; each screen passes its own. */
  readonly icon?: string;
  readonly emptyTitle?: string;
  readonly emptyBody?: string;
  readonly errorTitle?: string;
  /** Empty-state action; shown only when both are present. */
  readonly cta?: string;
  readonly href?: string;
  /** Defaults to re-running the page's loader (`router.refresh()`). */
  readonly onRetry?: () => void;
}

/**
 * The shared loading · empty · error block of every operator screen
 * (`Operador Estado.dc.html`). The happy state is the screen's own content.
 */
export function OperadorEstado(props: OperadorEstadoProps) {
  if (props.mode === 'loading') return <Loading />;
  if (props.mode === 'error') {
    return <ErrorBlock title={props.errorTitle} onRetry={props.onRetry} />;
  }
  return <Empty {...props} />;
}

function Loading() {
  return (
    <div className={s.loadingCard} aria-busy="true" aria-live="polite">
      <div className={s.loadingHead}>
        <span className={s.dot} />
        <span className={s.loadingLabel}>Cargando…</span>
      </div>
      {SKELETON_ROWS.map((n) => (
        <div key={n} className={s.row}>
          <span className={s.rowTile} />
          <span className={s.rowBar} />
          <span className={s.rowBarShort} />
        </div>
      ))}
    </div>
  );
}

function Empty({
  icon = CART,
  emptyTitle = 'Nada por aquí todavía',
  emptyBody = 'En cuanto captures algo, aparece en esta lista.',
  cta,
  href,
}: OperadorEstadoProps) {
  return (
    <div className={s.emptyCard}>
      <div className={s.tileEmpty} aria-hidden="true">
        <Icon path={icon} size={30} strokeWidth={2.3} />
      </div>
      <div className={s.title}>{emptyTitle}</div>
      <div className={s.bodyEmpty}>{emptyBody}</div>
      {cta && href ? (
        <Link href={href} className={s.actionYellow}>
          {cta}
        </Link>
      ) : null}
    </div>
  );
}

function ErrorBlock({
  title = 'No pudimos cargar esta lista',
  onRetry,
}: {
  readonly title?: string;
  readonly onRetry?: () => void;
}) {
  const router = useRouter();
  return (
    <div className={s.errorCard} role="alert">
      <div className={s.tileError} aria-hidden="true">
        <svg
          width={30}
          height={30}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx={12} cy={12} r={9} />
          <path d={ALERT} />
        </svg>
      </div>
      <div className={s.title}>{title}</div>
      <div className={s.bodyError}>
        Lo que capturaste no se pierde: sigue guardado en este dispositivo. Vuelve a intentar en un
        momento.
      </div>
      <button type="button" className={s.actionWhite} onClick={onRetry ?? (() => router.refresh())}>
        Reintentar
      </button>
    </div>
  );
}
