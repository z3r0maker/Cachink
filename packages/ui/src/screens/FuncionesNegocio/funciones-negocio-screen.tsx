/**
 * FuncionesNegocioScreen — Director-only feature flag management.
 *
 * Full-screen route from Settings → "Funciones del negocio".
 * Displays all feature flags with toggle switches and dependency hints.
 *
 * Phase 3 of the Feature Flags plan.
 */

import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import {
  canEnableFlag,
  resolveDisableCascade,
  type FeatureFlagKey,
  type FeatureFlags,
} from '@cachink/domain';
import { SafeAreaSpacer } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { FLAG_DISPLAY_INFO, type FlagDisplayInfo } from './flag-descriptions';
import { FeatureFlagCard } from './feature-flag-card';

export interface FuncionesNegocioScreenProps {
  readonly flags: FeatureFlags;
  readonly onToggle: (key: FeatureFlagKey, newFlags: FeatureFlags) => void;
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

function FuncionesHeader({ t }: { t: T }): ReactElement {
  return (
    <>
      <SafeAreaSpacer />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={28}
        color={colors.black}
      >
        {t('funciones.title')}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontSize={14}
        color={colors.gray600}
        marginBottom={8}
      >
        {t('funciones.subtitle')}
      </Text>
    </>
  );
}

function buildFlagHint(flags: FeatureFlags, info: FlagDisplayInfo, t: T): string | null {
  if (canEnableFlag(flags, info.key)) return null;
  if (!info.parentKey) return null;
  const parentLabel = FLAG_DISPLAY_INFO.find((f) => f.key === info.parentKey)?.labelKey ?? '';
  return t('funciones.requiresHint', { parent: t(parentLabel as never) });
}

export function FuncionesNegocioScreen(props: FuncionesNegocioScreenProps): ReactElement {
  const { t } = useTranslation();
  const handleToggle = (key: FeatureFlagKey, newValue: boolean): void => {
    props.onToggle(
      key,
      newValue ? { ...props.flags, [key]: true } : resolveDisableCascade(props.flags, key),
    );
  };
  return (
    <ScrollView
      testID={props.testID ?? 'funciones-negocio'}
      contentContainerStyle={{ padding: 16, gap: 12 }}
    >
      <FuncionesHeader t={t} />
      <View gap={10}>
        {FLAG_DISPLAY_INFO.map((info) => {
          const enabled = props.flags[info.key];
          const allowed = canEnableFlag(props.flags, info.key);
          return (
            <FeatureFlagCard
              key={info.key}
              info={info}
              enabled={enabled}
              canToggle={enabled || allowed}
              dependencyHint={buildFlagHint(props.flags, info, t)}
              onToggle={(v) => handleToggle(info.key, v)}
              testID={`flag-${info.key}`}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}
