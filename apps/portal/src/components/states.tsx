import type { ReactNode } from 'react';

import { Button } from './button';
import {
  loadingBlock,
  loadingLabel,
  stateAction,
  stateBody,
  stateCard,
  stateTitle,
  tile,
  tileEmpty,
  tileError,
} from './states.css';

interface StateProps {
  readonly title: string;
  readonly body: string;
  readonly glyph?: ReactNode;
}

export interface EmptyStateProps extends StateProps {
  /** Hidden for read-only roles — pass `undefined` rather than disabling it. */
  readonly action?: { readonly label: string; readonly onClick: () => void };
}

export function EmptyState({ title, body, glyph, action }: EmptyStateProps) {
  return (
    <div className={stateCard}>
      <div className={`${tile} ${tileEmpty}`} aria-hidden="true">
        {glyph}
      </div>
      <h2 className={stateTitle}>{title}</h2>
      <p className={stateBody}>{body}</p>
      {action ? (
        <div className={stateAction}>
          <Button onClick={action.onClick}>{action.label}</Button>
        </div>
      ) : null}
    </div>
  );
}

export interface ErrorStateProps extends Partial<StateProps> {
  readonly onRetry: () => void;
}

/**
 * Error copy must reassure that nothing was lost: offline capture is a core
 * promise of the product, and a portal error never means a sale went missing
 * (ADR-058).
 */
export function ErrorState({
  title = 'Algo salió mal',
  body = 'Tus registros están a salvo. Revisa tu conexión e inténtalo otra vez.',
  glyph,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={stateCard}>
      <div className={`${tile} ${tileError}`} aria-hidden="true">
        {glyph}
      </div>
      <h2 className={stateTitle}>{title}</h2>
      <p className={stateBody}>{body}</p>
      <div className={stateAction}>
        <Button variant="dark" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    </div>
  );
}

export interface LoadingStateProps {
  /** Block heights in px, sized to the content they stand in for. */
  readonly blocks?: readonly number[];
}

export function LoadingState({ blocks = [196, 120, 120] }: LoadingStateProps) {
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
      aria-busy="true"
      aria-live="polite"
    >
      <span className={loadingLabel}>Cargando…</span>
      {blocks.map((height, i) => (
        <div key={`${height}-${i}`} className={loadingBlock} style={{ height }} />
      ))}
    </div>
  );
}
