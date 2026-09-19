/**
 * SettingsScreen — device-only Configuración (A-12).
 *
 * Everything about the business (negocio, ISR, empleados, operadores,
 * productos) is managed in the portal; the phone keeps only what belongs to
 * it: Cuenta, Sincronización, Dispositivo and Datos.
 */

import type { ReactElement, ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { SectionTitle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import { SettingsAccountSection } from './settings-account-section';
import {
  SettingsDataSection,
  SettingsDeviceSection,
  type DeviceSettings,
} from './settings-device-section';
import { SettingsSyncSection } from './settings-sync-section';

export interface SettingsScreenProps {
  readonly device: DeviceSettings;
  readonly onOpenRejected: () => void;
  /** Dev-only tools (reset database). */
  readonly footer?: ReactNode;
  readonly testID?: string;
}

export function SettingsScreen(props: SettingsScreenProps): ReactElement {
  const { t } = useTranslation();
  return (
    <ScrollView
      testID={props.testID ?? 'settings-screen'}
      style={{ flex: 1, backgroundColor: colors.offwhite }}
      contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 32 }}
    >
      <SectionTitle title={t('settings.hubTitle')} />
      <SettingsAccountSection />
      <SettingsSyncSection onOpenRejected={props.onOpenRejected} />
      <SettingsDeviceSection device={props.device} />
      <SettingsDataSection />
      {props.footer}
    </ScrollView>
  );
}
