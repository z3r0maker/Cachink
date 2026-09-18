import type { ReactNode } from 'react';

import type { ScreenState } from '@/session/types';

import { EmptyState, ErrorState, LoadingState } from './states';
import { LockedState, ProximamenteState } from './gated-states';

export interface ScreenBodyProps {
  readonly state: ScreenState;
  /** Rendered only in the `happy` state. */
  readonly children: ReactNode;
  readonly empty: { readonly title: string; readonly body: string; readonly action?: ReactNode };
  readonly onRetry: () => void;
  readonly loadingBlocks?: readonly number[];
  readonly locked?: { readonly title: string; readonly body: string; readonly plan: string };
  readonly proximamente?: { readonly title: string; readonly body: string };
}

/**
 * The six states, swapped in the content area only.
 *
 * The shell, the page title and the filters stay put — they are the caller's,
 * rendered above this. That separation is what lets Fase 5's sweep force any
 * state from props without touching code (ADR-058 §9).
 */
export function ScreenBody({
  state,
  children,
  empty,
  onRetry,
  loadingBlocks,
  locked,
  proximamente,
}: ScreenBodyProps) {
  if (state === 'loading') return <LoadingState blocks={loadingBlocks} />;
  if (state === 'error') return <ErrorState onRetry={onRetry} />;
  if (state === 'locked' && locked) {
    return <LockedState title={locked.title} body={locked.body} plan={locked.plan} />;
  }
  if (state === 'proximamente' && proximamente) {
    return <ProximamenteState title={proximamente.title} body={proximamente.body} />;
  }
  if (state === 'empty') {
    return <EmptyState title={empty.title} body={empty.body} />;
  }
  return <>{children}</>;
}
