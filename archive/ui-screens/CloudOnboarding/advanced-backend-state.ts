/**
 * State + validation helpers for AdvancedBackendScreen (P1E-M3 C11).
 * Extracted from advanced-backend-screen.tsx to keep the component
 * file inside the 200-line budget (CLAUDE.md §4.4).
 */

import { useState } from 'react';
import type { CloudBackendConfig } from '../../sync/cloud-bridge';
import type { AdvancedBackendScreenProps } from './advanced-backend-screen';

export interface AdvancedState {
  projectUrl: string;
  anonKey: string;
  powersyncUrl: string;
  status: 'idle' | 'saving' | 'error';
  errorMsg: string | null;
}

function looksLikeServiceRoleKey(value: string): boolean {
  // Supabase service-role keys are JWTs with a role claim = "service_role".
  // We inspect the payload without full verification because intent alone
  // is enough to reject.
  try {
    const payload = value.split('.')[1];
    if (!payload) return false;
    const decoded = globalThis.atob
      ? globalThis.atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
      : '';
    return decoded.includes('"service_role"');
  } catch {
    return false;
  }
}

export function validateAdvancedState(state: AdvancedState): string | null {
  if (!state.projectUrl.startsWith('https://')) return 'La URL debe empezar con https://';
  if (state.anonKey.length < 20) return 'La llave anónima parece incompleta';
  if (looksLikeServiceRoleKey(state.anonKey))
    return 'Detectamos una service-role key. Usa solo la llave anónima (anon/publishable).';
  return null;
}

export function useAdvancedState(
  existing: CloudBackendConfig | null,
): [AdvancedState, (next: Partial<AdvancedState>) => void] {
  const [state, setState] = useState<AdvancedState>({
    projectUrl: existing?.projectUrl ?? '',
    anonKey: existing?.anonKey ?? '',
    powersyncUrl: existing?.powersyncUrl ?? '',
    status: 'idle',
    errorMsg: null,
  });
  const patch = (next: Partial<AdvancedState>): void => setState((s) => ({ ...s, ...next }));
  return [state, patch];
}

export function useAdvancedSave(
  state: AdvancedState,
  patch: (next: Partial<AdvancedState>) => void,
  onSave: AdvancedBackendScreenProps['onSave'],
): () => Promise<void> {
  return async (): Promise<void> => {
    const err = validateAdvancedState(state);
    if (err) {
      patch({ status: 'error', errorMsg: err });
      return;
    }
    patch({ status: 'saving', errorMsg: null });
    try {
      await onSave({
        projectUrl: state.projectUrl,
        anonKey: state.anonKey,
        powersyncUrl: state.powersyncUrl.length > 0 ? state.powersyncUrl : null,
      });
      patch({ status: 'idle' });
    } catch (error) {
      patch({ status: 'error', errorMsg: error instanceof Error ? error.message : String(error) });
    }
  };
}
