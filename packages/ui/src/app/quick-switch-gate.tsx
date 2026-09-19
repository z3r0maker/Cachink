/**
 * QuickSwitchGate — user avatar selection + NIP login.
 *
 * Thin orchestrator: delegates auth logic to `useQuickSwitchAuth`
 * and renders the quick-switch screen. A forgotten NIP is the owner's
 * to reset from the portal (ADR-072) — there is no recovery flow here.
 */

import type { ReactElement } from 'react';
import type { BusinessId } from '@xangarro/domain';
import { QuickSwitchScreen } from '../screens/Login/index';
import { useCurrentBusiness } from '../hooks/use-current-business';
import { useQuickSwitchAuth } from './use-quick-switch-auth';

export interface QuickSwitchGateProps {
  readonly businessId: BusinessId;
}

export function QuickSwitchGate(props: QuickSwitchGateProps): ReactElement {
  const auth = useQuickSwitchAuth(props.businessId);
  const { data: business } = useCurrentBusiness();

  return (
    <QuickSwitchScreen
      users={auth.users}
      businessName={business?.nombre}
      onAuthenticate={auth.handleAuth}
      error={auth.error}
      submitting={auth.submitting}
    />
  );
}
