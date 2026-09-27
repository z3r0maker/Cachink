'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Don } from '@/components/don/don';

import { Icon } from '../shell/icon';
import * as s from './estado.css';

export type EstadoMode = 'loading' | 'empty' | 'error';

const FLECHA = 'M5 12h14M13 6l6 6-6 6';
const OTRA_VEZ = 'M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8M21 3v5h-5';
const FRASES = ['Contando monedas', 'Cuadrando la caja', 'Sacando cuentas', 'Ya casi, ya casi'];
const FILAS = ['52%', '38%', '46%'] as const;

export interface OperadorEstadoProps {
  readonly mode: EstadoMode;
  /** Kept for callers: the board shows Don Cuentas helping instead of a glyph. */
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
 * (OpEstados). The happy state is the screen's own content.
 */
export function OperadorEstado(props: OperadorEstadoProps) {
  if (props.mode === 'loading') return <Loading />;
  if (props.mode === 'error') {
    return <ErrorBlock title={props.errorTitle} onRetry={props.onRetry} />;
  }
  return <Empty {...props} />;
}

/** The line changes every 1.8 s; one line when motion is reduced. */
function useFrase(): string {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % FRASES.length), 1800);
    return () => window.clearInterval(t);
  }, []);
  return FRASES[i] ?? FRASES[0] ?? '';
}

function Loading() {
  const frase = useFrase();
  return (
    <section className={s.loadingCard} role="status" aria-live="polite" aria-busy="true">
      <div className={s.scene} aria-hidden="true">
        <span className={s.coin}>$</span>
        <span className={s.don}>
          <Don pose="contando" size={150} />
        </span>
      </div>
      <span className={s.frase}>{frase}…</span>
      <span className={s.sub}>Don Cuentas está sacando tus números</span>
      <div className={s.rows} aria-hidden="true">
        {FILAS.map((w) => (
          <div key={w} className={s.row}>
            <span className={s.rowTile} />
            <span className={s.rowBar} style={{ width: w }} />
            <span className={s.rowBarShort} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Empty({
  emptyTitle = 'Nada por aquí todavía',
  emptyBody = 'En cuanto captures algo, aparece en esta lista.',
  cta,
  href,
}: OperadorEstadoProps) {
  return (
    <section className={s.emptyCard} aria-label={emptyTitle}>
      <Don pose="ayuda" size={180} />
      <h2 className={s.title}>{emptyTitle}</h2>
      <p className={s.body}>{emptyBody}</p>
      {cta && href ? (
        <Link href={href} className={s.action}>
          {cta}
          <Icon path={FLECHA} size={20} strokeWidth={2.6} />
        </Link>
      ) : null}
    </section>
  );
}

/** Retry, showing «Intentando…» with the spinning coin for a moment. */
function useReintento(onRetry: (() => void) | undefined) {
  const router = useRouter();
  const [intentando, setIntentando] = useState(false);
  const t = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(t.current), []);
  const reintentar = (): void => {
    setIntentando(true);
    (onRetry ?? (() => router.refresh()))();
    window.clearTimeout(t.current);
    t.current = window.setTimeout(() => setIntentando(false), 1600);
  };
  return { intentando, reintentar };
}

function ErrorBlock({
  title = 'No pudimos cargar esta lista',
  onRetry,
}: {
  readonly title?: string;
  readonly onRetry?: () => void;
}) {
  const r = useReintento(onRetry);
  return (
    <section className={s.errorCard} role="alert">
      <Don pose="preocupado" size={180} />
      <h2 className={s.title}>{title}</h2>
      <p className={s.body}>
        <b className={s.safe}>Tus datos están a salvo en esta computadora.</b> Lo que capturaste no
        se pierde. Vuelve a intentar en un momento.
      </p>
      <button type="button" className={s.action} disabled={r.intentando} onClick={r.reintentar}>
        {r.intentando ? (
          <span className={s.spin} aria-hidden="true" />
        ) : (
          <Icon path={OTRA_VEZ} size={20} strokeWidth={2.4} />
        )}
        {r.intentando ? 'Intentando…' : 'Intentar de nuevo'}
      </button>
    </section>
  );
}
