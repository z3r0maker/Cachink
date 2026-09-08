/**
 * Settings — the Director-reachable settings screen (P1C-M1-T04).
 *
 * Receives business + mode via props. Tail rows in `./settings-tail.tsx`.
 */

import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { Business } from '@cachink/domain';
import { Btn, Card, Icon, SectionTitle, Tag } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import type { AppMode } from '../../app-config/index';
import { colors, fontSizes, typography } from '../../theme';
import type { FeedbackActionProps } from './feedback-action';
import { EditBusinessModal } from './edit-business-modal';
import { IsrDefaultsCard } from './isr-defaults-card';
import { LanSection, SettingsTail } from './settings-tail';

type T = ReturnType<typeof useTranslation>['t'];

export interface SettingsProps {
  readonly mode: AppMode | null;
  readonly business: Business | null;
  readonly onReRunWizard: () => void;
  /**
   * When false, the ExportarDatosAction card is hidden. Tests that
   * render <Settings /> outside a RepositoryProvider rely on this to
   * skip the TanStack query wiring. Defaults to `true`.
   */
  readonly showExportAction?: boolean;
  /** When false, the NotificationsToggle is hidden. Defaults to `true`. */
  readonly showNotificationsToggle?: boolean;
  readonly notificationsEnabled?: boolean;
  readonly onNotificationsChange?: (next: boolean) => void;
  /** Whether the "¡CACHINK!" sale sound is enabled. Defaults to `true`. */
  readonly cachinkSoundEnabled?: boolean;
  readonly onCachinkSoundChange?: (next: boolean) => void;
  /** LAN-only: metadata for the LanDetailsCard. Omit to hide. */
  readonly lanDetails?: {
    serverUrl: string | null;
    connectedDevices: number;
    isHost: boolean;
    onUnpair: () => void;
    unpairSubmitting?: boolean;
    onStopHostServer?: () => void;
    stopHostSubmitting?: boolean;
  };
  /**
   * Cloud-only: tapping "Avanzado" routes the user to AdvancedBackendRoute
   * so they can paste a custom Supabase / Postgres config (Slice 8 C4).
   * Omit to hide the row.
   */
  readonly onOpenAdvancedBackend?: () => void;
  /**
   * When provided, renders the `<FeedbackAction>` "Enviar comentarios"
   * card driven by these props (Slice 9.6 T10). Omit to hide.
   */
  readonly feedback?: Omit<FeedbackActionProps, 'testID'>;
  /**
   * When provided, renders the "Buscar actualizaciones" row
   * (Slice 9.6 T11). Tap fires the callback; the parent owns the
   * useCheckForUpdates plumbing.
   */
  readonly onCheckForUpdates?: () => void;
  readonly checkForUpdatesStatus?: string;
  /** Director only: navigates to Funciones del negocio screen. */
  readonly onOpenFunciones?: () => void;
  /** Current crash-reporting consent state. */
  readonly crashReportingEnabled?: boolean;
  /** Toggle crash reporting on/off from Settings. */
  readonly onCrashReportingChange?: (next: boolean) => void;
  /** Open the bug report sheet. */
  readonly onOpenBugReport?: () => void;
  readonly testID?: string;
}

function modeLabelKey(mode: AppMode | null): string {
  switch (mode) {
    case 'local':
      return 'wizard.modeNames.local';
    case 'lan-server':
      return 'wizard.modeNames.lanServer';
    case 'lan-client':
      return 'wizard.modeNames.lanClient';
    case 'cloud':
      return 'wizard.modeNames.cloud';
    default:
      return 'wizard.modeNames.local';
  }
}

function SettingsRow({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingVertical={6}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.xs}
        letterSpacing={typography.letterSpacing.wide}
        color={colors.gray600}
        style={{ textTransform: 'uppercase' }}
      >
        {label}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={fontSizes.lg}
        color={colors.black}
      >
        {value}
      </Text>
    </View>
  );
}

function BusinessCard({
  business,
  t,
  onEdit,
}: {
  business: Business | null;
  t: T;
  onEdit?: () => void;
}): ReactElement {
  // Use 10_000/100 trick to preserve up to 2 decimal places (RESICO = 1.25%).
  const isrPct = business ? `${business.isrTasa / 100}%` : '—';
  return (
    <Card testID="settings-business-card" padding="md" fullWidth>
      <SettingsRow
        label={t('settings.negocioLabel')}
        value={business?.nombre ?? t('settings.negocioNoConfigurado')}
      />
      <SettingsRow label={t('settings.regimenLabel')} value={business?.regimenFiscal ?? '—'} />
      <SettingsRow label={t('settings.isrLabel')} value={isrPct} />
      {business && onEdit && (
        <View marginTop={8}>
          <Btn
            variant="ghost"
            size="sm"
            onPress={onEdit}
            testID="settings-edit-business"
            icon={<Icon name="pencil" size={16} color={colors.black} />}
          >
            {t('settings.editBusinessLabel')}
          </Btn>
        </View>
      )}
    </Card>
  );
}

function LanguageCard({ t }: { t: T }): ReactElement {
  return (
    <Card testID="settings-language-card" padding="md" fullWidth>
      <View flexDirection="row" alignItems="center" justifyContent="space-between">
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={fontSizes.xs}
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

function FuncionesCard(props: { label: string; onPress: () => void }): ReactElement {
  return (
    <Card testID="settings-funciones" padding="md" fullWidth onPress={props.onPress}>
      <View flexDirection="row" alignItems="center" justifyContent="space-between">
        <View flexDirection="row" alignItems="center" gap={8}>
          <Icon name="sliders" size={18} color={colors.black} />
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.semibold}
            fontSize={fontSizes.lg}
            color={colors.black}
          >
            {props.label}
          </Text>
        </View>
        <Icon name="chevron-right" size={16} color={colors.textMuted} />
      </View>
    </Card>
  );
}

function SettingsScrollContent(props: SettingsProps & { t: T; onEdit: () => void }): ReactElement {
  const isLan = props.mode === 'lan-server' || props.mode === 'lan-client';
  return (
    <ScrollView
      testID={props.testID ?? 'settings-screen'}
      style={{ flex: 1, backgroundColor: colors.offwhite }}
      contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 24 }}
    >
      <SectionTitle title={props.t('settings.title')} />
      <Card testID="settings-mode-card" padding="md" fullWidth>
        <SettingsRow
          label={props.t('settings.modoLabel')}
          value={props.t(modeLabelKey(props.mode) as 'wizard.modeNames.local')}
        />
      </Card>
      <BusinessCard business={props.business} t={props.t} onEdit={props.onEdit} />
      <IsrDefaultsCard />
      {props.onOpenFunciones && (
        <FuncionesCard label={props.t('settings.funciones')} onPress={props.onOpenFunciones} />
      )}
      {isLan && props.lanDetails && <LanSection lan={props.lanDetails} />}
      <LanguageCard t={props.t} />
      <SettingsTail props={props} t={props.t} />
    </ScrollView>
  );
}

export function Settings(props: SettingsProps): ReactElement {
  const { t } = useTranslation();
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <SettingsScrollContent {...props} t={t} onEdit={() => setEditOpen(true)} />
      {props.business && (
        <EditBusinessModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          business={props.business}
        />
      )}
    </>
  );
}
