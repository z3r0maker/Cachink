/**
 * OfflineBlocker — refuses to mount the cloud sub-flow when the device
 * is offline (ADR-039 safety rail).
 *
 * Wraps a child screen. When `useIsOnline() === false` it replaces the
 * child with a warning Callout that suggests the local-only fallback;
 * otherwise it renders the child unchanged.
 */

import type { ReactElement, ReactNode } from 'react';
import { Btn, Callout } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { useIsOnline } from '../../hooks/use-is-online';

export interface OfflineBlockerProps {
  /** Required when blocked — fires when the user taps the back action. */
  readonly onBack: () => void;
  /** The screen to render when online. */
  readonly children: ReactNode;
  readonly testID?: string;
}

export function OfflineBlocker(props: OfflineBlockerProps): ReactElement {
  const { t } = useTranslation();
  const online = useIsOnline();
  if (online) return <>{props.children}</>;
  return (
    <Callout
      testID={props.testID ?? 'wizard-offline-blocker'}
      tone="warning"
      title={t('wizard.callout.offlineTitle')}
      body={t('wizard.callout.offlineBody')}
      icon="📡"
      action={
        <Btn variant="dark" size="sm" onPress={props.onBack} testID="wizard-offline-blocker-back">
          {t('wizard.back')}
        </Btn>
      }
    />
  );
}
