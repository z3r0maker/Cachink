/**
 * useOutboxFlusher — triggers outbox flush on cold-start and AppState
 * foreground transitions.
 *
 * Consent-gated: the OutboxFlusher itself checks consent, so if the
 * user hasn't opted in, flush is a no-op.
 *
 * No NetInfo dependency — failed flushes simply retry on next lifecycle event.
 */

import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { OutboxFlusher } from '@cachink/observability';

/**
 * Mount once in the provider tree (after ObservabilityBridge).
 * Triggers a flush on mount (cold-start) and on foreground transition.
 */
export function useOutboxFlusher(flusher: OutboxFlusher | null): void {
  const flusherRef = useRef(flusher);
  flusherRef.current = flusher;

  useEffect(() => {
    if (!flusherRef.current) return;

    // Cold-start flush
    void flusherRef.current.flush().catch(() => {});

    // Foreground flush
    const onChange = (nextState: AppStateStatus): void => {
      if (nextState === 'active' && flusherRef.current) {
        void flusherRef.current.flush().catch(() => {});
      }
    };

    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [flusher]);
}
