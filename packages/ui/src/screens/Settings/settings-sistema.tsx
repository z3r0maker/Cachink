/**
 * SettingsSistema — system settings sub-screen.
 *
 * Combines: LanguageCard, NotificationsToggle, ExportarDatosAction,
 * CheckForUpdates, FeedbackAction, LanDetailsCard, AdvancedBackend,
 * and ReRunWizard. All components are existing — just re-arranged
 * into a dedicated screen reachable from the Settings hub.
 */

import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import { Card, SectionTitle, Tag } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { LanSection, SettingsTail } from './settings-tail';
import type { SettingsProps } from './settings';

export interface SettingsSistemaProps {
  /** Forward the full legacy SettingsProps so SettingsTail can render. */
  readonly settingsProps: SettingsProps;
  readonly testID?: string;
}

function LanguageCard(): ReactElement {
  const { t } = useTranslation();
  return (
    <Card testID="settings-language-card" padding="md" fullWidth>
      <View flexDirection="row" alignItems="center" justifyContent="space-between">
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={12}
          letterSpacing={typography.letterSpacing.wide}
          color={colors.gray600}
          style={{ textTransform: 'uppercase' }}
        >
          {t('settings.idiomaLabel')}
        </Text>
        <Tag>{t('settings.idiomaValue')}</Tag>
      </View>
    </Card>
  );
}

export function SettingsSistema(props: SettingsSistemaProps): ReactElement {
  const { t } = useTranslation();
  const sp = props.settingsProps;

  return (
    <ScrollView
      testID={props.testID ?? 'settings-sistema-screen'}
      style={{ flex: 1, backgroundColor: colors.offwhite }}
      contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 24 }}
    >
      <SectionTitle title={t('settings.sistemaCard')} />
      <LanguageCard />
      {(sp.mode === 'lan-server' || sp.mode === 'lan-client') && sp.lanDetails && (
        <LanSection lan={sp.lanDetails} />
      )}
      <SettingsTail props={sp} t={t} />
    </ScrollView>
  );
}
