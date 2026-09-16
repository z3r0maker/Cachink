/**
 * SettingsTasasIsr — sub-screen for ISR defaults per régimen.
 *
 * Wraps the existing `IsrDefaultsCard` in a full-screen layout
 * reachable from the Settings hub.
 */

import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { SectionTitle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import { IsrDefaultsCard } from './isr-defaults-card';

export interface SettingsTasasIsrProps {
  readonly testID?: string;
}

export function SettingsTasasIsr(props: SettingsTasasIsrProps): ReactElement {
  const { t } = useTranslation();
  return (
    <ScrollView
      testID={props.testID ?? 'settings-tasas-isr-screen'}
      style={{ flex: 1, backgroundColor: colors.offwhite }}
      contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 24 }}
    >
      <SectionTitle title={t('settings.tasasIsrCard')} />
      <IsrDefaultsCard />
    </ScrollView>
  );
}
