/**
 * SettingsNegocio — sub-screen for business detail/edit.
 *
 * Extracts the existing BusinessCard + EditBusinessModal into a
 * dedicated screen reachable from the Settings hub.
 */

import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { AppMode } from '../../app-config/index';
import type { Business } from '@cachink/domain';
import { Btn, Card, Icon, SectionTitle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';
import { EditBusinessModal } from './edit-business-modal';

export interface SettingsNegocioProps {
  readonly mode: AppMode | null;
  readonly business: Business | null;
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

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

function InfoRow({ label, value }: { label: string; value: string }): ReactElement {
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

function BusinessInfoCard({
  business,
  onEdit,
  t,
}: {
  business: Business | null;
  onEdit: () => void;
  t: T;
}): ReactElement {
  const isrPct = business ? `${business.isrTasa / 100}%` : '—';
  return (
    <Card testID="settings-business-card" padding="md" fullWidth>
      <InfoRow
        label={t('settings.negocioLabel')}
        value={business?.nombre ?? t('settings.negocioNoConfigurado')}
      />
      <InfoRow label={t('settings.regimenLabel')} value={business?.regimenFiscal ?? '—'} />
      <InfoRow label={t('settings.isrLabel')} value={isrPct} />
      {business && (
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

export function SettingsNegocio(props: SettingsNegocioProps): ReactElement {
  const { t } = useTranslation();
  const [editOpen, setEditOpen] = useState(false);
  const { business, mode } = props;
  return (
    <>
      <ScrollView
        testID={props.testID ?? 'settings-negocio-screen'}
        style={{ flex: 1, backgroundColor: colors.offwhite }}
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 24 }}
      >
        <SectionTitle title={t('settings.negocioCard')} />
        <Card testID="settings-mode-card" padding="md" fullWidth>
          <InfoRow
            label={t('settings.modoLabel')}
            value={t(modeLabelKey(mode) as 'wizard.modeNames.local')}
          />
        </Card>
        <BusinessInfoCard business={business} onEdit={() => setEditOpen(true)} t={t} />
      </ScrollView>
      {business && (
        <EditBusinessModal open={editOpen} onClose={() => setEditOpen(false)} business={business} />
      )}
    </>
  );
}
