/**
 * AdvancedBackendRoute — smart wrapper that wires `AdvancedBackendScreen`
 * to the BYO-backend persistence layer (Slice 8 C4).
 *
 * Pure presentational `AdvancedBackendScreen` already accepts `existing`,
 * `onSave`, and `onClear` callbacks. This route reads the saved config
 * via `useByoBackend()` and forwards the persistence to that hook so any
 * caller (Settings → Avanzado, the wizard's CloudOnboarding "Avanzado"
 * link) gets the same behaviour without re-implementing it.
 *
 * Pure UI screen lives in `./advanced-backend-screen.tsx`.
 */

import { type ReactElement } from 'react';
import { AdvancedBackendScreen } from './advanced-backend-screen';
import { useByoBackend } from '../../sync/use-byo-backend';

export interface AdvancedBackendRouteProps {
  readonly onCancel: () => void;
  readonly onSaved?: () => void;
  readonly testID?: string;
}

export function AdvancedBackendRoute(props: AdvancedBackendRouteProps): ReactElement | null {
  const { config, loading, save, clear } = useByoBackend();
  if (loading) return null;
  return (
    <AdvancedBackendScreen
      existing={config}
      onSave={async (next) => {
        await save(next);
        props.onSaved?.();
      }}
      onClear={async () => {
        await clear();
        props.onSaved?.();
      }}
      onCancel={props.onCancel}
      testID={props.testID}
    />
  );
}
