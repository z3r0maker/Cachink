/**
 * En este teléfono (A-12, MvAjustes): the settings that belong to this phone:
 * notifications, crash reports, checking for updates. Under it, «Ayuda»: the
 * row that opens the report sheet (RpAjustes, M-23), no longer a grey button.
 * Exporting the business's data is the owner's, in the portal.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { Btn, GLYPHS, MText, NavRows } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { CrashReportingToggle } from './crash-reporting-toggle';
import { NotificationsToggle } from './notifications-toggle';
import { colors, typography } from '../../theme';
import { SettingsSection } from './settings-section';

export interface DeviceSettings {
  readonly notificationsEnabled: boolean;
  readonly onNotificationsChange: (next: boolean) => void;
  readonly crashReportingEnabled: boolean;
  readonly onCrashReportingChange: (next: boolean) => void;
  readonly onReportProblem: () => void;
  readonly onCheckForUpdates?: () => void;
  readonly checkForUpdatesStatus?: string;
}

/** «Ayuda»: one row, with its icon, that opens the report sheet (RpAjustes). */
function Ayuda({ onReportProblem }: { onReportProblem: () => void }): ReactElement {
  const { t } = useTranslation();
  return (
    <View gap={8}>
      <MText
        size="xs"
        weight="extraBold"
        color={colors.gray600}
        textTransform="uppercase"
        letterSpacing={typography.letterSpacing.widest}
      >
        {t('reportar.ajustesSeccion')}
      </MText>
      <NavRows
        testID="settings-ayuda"
        label={t('reportar.ajustesSeccion')}
        items={[
          {
            key: 'reportar',
            title: t('settings.reportBugCta'),
            detail: t('reportar.filaDetalle'),
            icon: GLYPHS.ayuda,
            tint: colors.yellow,
            onPress: onReportProblem,
            testID: 'settings-open-bug-report',
          },
        ]}
      />
    </View>
  );
}

export function SettingsDeviceSection(props: { readonly device: DeviceSettings }): ReactElement {
  const { t } = useTranslation();
  const d = props.device;
  const updatesLabel = d.checkForUpdatesStatus
    ? `${t('settings.checkForUpdatesCta')} — ${d.checkForUpdatesStatus}`
    : t('settings.checkForUpdatesCta');
  return (
    <View gap={16}>
      <SettingsSection title={t('settings.dispositivoSection')} testID="settings-device">
        <NotificationsToggle enabled={d.notificationsEnabled} onChange={d.onNotificationsChange} />
        <CrashReportingToggle
          enabled={d.crashReportingEnabled}
          onChange={d.onCrashReportingChange}
        />
        {d.onCheckForUpdates && (
          <Btn
            variant="ghost"
            onPress={d.onCheckForUpdates}
            fullWidth
            testID="settings-check-for-updates"
          >
            {updatesLabel}
          </Btn>
        )}
      </SettingsSection>
      <Ayuda onReportProblem={d.onReportProblem} />
    </View>
  );
}
