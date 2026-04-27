/**
 * Settings — the Director-reachable settings screen (P1C-M1-T04).
 *
 * Phase 1C ships a minimal read-only view: the selected mode, the
 * business identity, and an es-MX language chip (disabled). The
 * "Re-ejecutar asistente" button clears the mode on the AppConfig store
 * + routes to `/wizard` — wiring that lives in the app-shell route.
 *
 * Pure UI — receives business + mode via props so the component is
 * trivially testable without a repo fixture. Tail rows live in
 * `./settings-tail.tsx` to stay under the 200-line file budget
 * (CLAUDE.md §4.4).
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Business } from '@cachink/domain';
import { Card, SectionTitle, Tag } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import type { AppMode } from '../../app-config/index';
import { colors, typography } from '../../theme';
import type { FeedbackActionProps } from './feedback-action';
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
  /** LAN-only: metadata for the LanDetailsCard. Omit to hide. */
  readonly lanDetails?: {
    serverUrl: string | null;
    connectedDevices: number;
    isHost: boolean;
    onUnpair: () => void;
    onStopHostServer?: () => void;
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
        fontSize={12}
        letterSpacing={typography.letterSpacing.wide}
        color={colors.gray600}
        style={{ textTransform: 'uppercase' }}
      >
        {label}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={16}
        color={colors.black}
      >
        {value}
      </Text>
    </View>
  );
}

function BusinessCard({ business, t }: { business: Business | null; t: T }): ReactElement {
  const isrPct = business ? `${Math.round(business.isrTasa * 100)}%` : '—';
  return (
    <Card testID="settings-business-card" padding="md" fullWidth>
      <SettingsRow
        label={t('settings.negocioLabel')}
        value={business?.nombre ?? t('settings.negocioNoConfigurado')}
      />
      <SettingsRow label={t('settings.regimenLabel')} value={business?.regimenFiscal ?? '—'} />
      <SettingsRow label={t('settings.isrLabel')} value={isrPct} />
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

export function Settings(props: SettingsProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      testID={props.testID ?? 'settings-screen'}
      flex={1}
      padding={20}
      gap={20}
      backgroundColor={colors.offwhite}
    >
      <SectionTitle title={t('settings.title')} />
      <Card testID="settings-mode-card" padding="md" fullWidth>
        <SettingsRow
          label={t('settings.modoLabel')}
          value={t(modeLabelKey(props.mode) as 'wizard.modeNames.local')}
        />
      </Card>
      <BusinessCard business={props.business} t={t} />
      {(props.mode === 'lan-server' || props.mode === 'lan-client') && props.lanDetails && (
        <LanSection lan={props.lanDetails} />
      )}
      <LanguageCard t={t} />
      <SettingsTail props={props} t={t} />
    </View>
  );
}
