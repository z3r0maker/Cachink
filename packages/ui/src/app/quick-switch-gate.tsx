/**
 * QuickSwitchGate — user avatar selection + PIN login.
 *
 * Thin orchestrator: delegates auth logic to `useQuickSwitchAuth`
 * and renders either the recovery flow or the quick-switch screen.
 *
 * Refactored per CLAUDE.md §6 (40-line budget).
 * ADR-049: PIN for daily login, Password for recovery.
 */

import type { ReactElement } from 'react';
import type { BusinessId } from '@cachink/domain';
import { QuickSwitchScreen, RecoveryScreen } from '../screens/Login/index';
import { useQuickSwitchAuth } from './use-quick-switch-auth';

export interface QuickSwitchGateProps {
  readonly businessId: BusinessId;
}

export function QuickSwitchGate(props: QuickSwitchGateProps): ReactElement {
  const auth = useQuickSwitchAuth(props.businessId);

  if (auth.recoveryUserId !== null) {
    return (
      <RecoveryScreen
        userId={auth.recoveryUserId}
        maskedEmail={auth.maskedRecoveryEmail}
        onRecoverWithPassword={auth.handleRecover}
        onFactoryReset={() => {
          // Factory reset handled by the app shell — clearing
          // all data is beyond this gate's responsibility.
        }}
        onBack={auth.cancelRecovery}
        error={auth.error}
        submitting={auth.submitting}
      />
    );
  }

  return (
    <QuickSwitchScreen
      users={auth.users}
      onAuthenticate={auth.handleAuth}
      onForgotPin={auth.startRecovery}
      error={auth.error}
      submitting={auth.submitting}
    />
  );
}
