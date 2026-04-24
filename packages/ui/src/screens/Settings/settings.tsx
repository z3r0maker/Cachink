/**
 * Settings — the Director-reachable settings screen (P1C-M1-T04).
 *
 * Phase 1C ships a minimal read-only view: the selected mode, the
 * business identity, and an es-MX language chip (disabled). The
 * "Re-ejecutar asistente" button clears the mode on the AppConfig store
 * + routes to `/wizard` — wiring that lives in the app-shell route.
 *
 * Pure UI — receives business + mode via props so the component is
 * trivially testable without a repo fixture.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Business } from '@cachink/domain';
import { Btn, Card, SectionTitle, Tag } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import type { AppMode } from '../../app-config/index';
import { colors, typography } from '../../theme';

type T = ReturnType<typeof useTranslation>['t'];

export interface SettingsProps {
  readonly mode: AppMode | null;
  readonly business: Business | null;
  readonly onReRunWizard: () => void;
  readonly testID?: string;
}

function modeLabelKey(mode: AppMode | null): string {
  switch (mode) {
    case 'local-standalone':
      return 'settings.modoLocal';
    case 'tablet-only':
      return 'settings.modoTabletOnly';
    case 'lan':
      return 'settings.modoLan';
    case 'cloud':
      return 'settings.modoCloud';
    default:
      return 'settings.modoLocal';
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
          value={t(modeLabelKey(props.mode) as 'settings.modoLocal')}
        />
      </Card>
      <BusinessCard business={props.business} t={t} />
      <LanguageCard t={t} />
      <View marginTop={8}>
        <Btn variant="soft" onPress={props.onReRunWizard} fullWidth testID="settings-re-run-wizard">
          {t('settings.reRunWizard')}
        </Btn>
      </View>
    </View>
  );
}
