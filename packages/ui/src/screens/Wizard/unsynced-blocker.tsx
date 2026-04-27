/**
 * UnsyncedBlocker — refuses to change AppMode while the device has
 * pending push HWM > 0 (ADR-039 safety rail).
 *
 * Wraps a child screen. When `usePendingChanges().count > 0` AND the
 * user has not pressed the explicit "cambiar de todas formas" escape
 * hatch yet, replaces the child with a warning Callout. The escape
 * hatch sets `forceModeChange = true` on the wizard store so the next
 * mount of this component lets the child through.
 *
 * First-run skips the check entirely (no prior mode means no pending
 * changes to lose).
 */

import type { ReactElement, ReactNode } from 'react';
import { View } from '@tamagui/core';
import { Btn, Callout } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { usePendingChanges } from '../../hooks/use-pending-changes';
import { useWizardForceModeChange, useWizardSetForceModeChange } from './state';

export interface UnsyncedBlockerProps {
  readonly children: ReactNode;
  readonly testID?: string;
}

export function UnsyncedBlocker(props: UnsyncedBlockerProps): ReactElement {
  const { t } = useTranslation();
  const { count, loading } = usePendingChanges();
  const forced = useWizardForceModeChange();
  const setForced = useWizardSetForceModeChange();
  if (loading) return <></>;
  if (count === 0 || forced) return <>{props.children}</>;
  return (
    <View testID={props.testID ?? 'wizard-unsynced-blocker'} width="100%" gap={10}>
      <Callout
        tone="warning"
        title={t('wizard.callout.unsyncedTitle')}
        body={t('wizard.callout.unsyncedBody', { count })}
        icon="⏳"
      />
      <Btn variant="ghost" onPress={() => setForced(true)} testID="wizard-unsynced-force-cta">
        {t('wizard.callout.unsyncedForceCta')}
      </Btn>
    </View>
  );
}
