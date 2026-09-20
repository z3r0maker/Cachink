/**
 * QuickSwitchGate — pick an operator, enter the PIN (A-05).
 *
 * Operators are created in the portal and arrive by sync. Until the first
 * one exists the screen says where to create it and offers "Actualizar".
 */

import type { ReactElement } from 'react';
import type { BusinessId } from '@xangarro/domain';
import { Btn, EmptyState, FloatingCoinsBackground } from '../components/index';
import { useCurrentBusiness } from '../hooks/use-current-business';
import { useTranslation } from '../i18n/index';
import { QuickSwitchScreen } from '../screens/Login/index';
import { AppLoadingSkeleton } from './app-loading-skeleton';
import { useCloudSync } from './cloud-sync-bridge';
import { useQuickSwitchAuth } from './use-quick-switch-auth';

export interface QuickSwitchGateProps {
  readonly businessId: BusinessId;
}

function NoOperators(): ReactElement {
  const { t } = useTranslation();
  const { state, syncNow } = useCloudSync();
  return (
    <FloatingCoinsBackground testID="quick-switch-empty">
      <EmptyState
        icon="users"
        title={t('login.noOperatorsTitle')}
        description={t('login.noOperatorsBody')}
        action={
          <Btn
            variant="dark"
            onPress={syncNow}
            loading={state.phase === 'syncing'}
            testID="quick-switch-refresh"
          >
            {t('login.refresh')}
          </Btn>
        }
      />
    </FloatingCoinsBackground>
  );
}

export function QuickSwitchGate(props: QuickSwitchGateProps): ReactElement {
  const auth = useQuickSwitchAuth(props.businessId);
  const { data: business } = useCurrentBusiness();
  if (auth.loading) return <AppLoadingSkeleton />;
  if (auth.users.length === 0) return <NoOperators />;
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
