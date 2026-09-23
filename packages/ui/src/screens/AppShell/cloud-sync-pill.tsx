/**
 * CloudSyncPill — top-bar sync status for an activated device (A-07).
 * Tapping it is "Actualizar" (push then pull now) — or, when the server
 * rejected rows, opens "No enviados" (A-08) where a human can act.
 */

import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Text, View } from '@tamagui/core';
import { useCloudSync } from '../../app/cloud-sync-bridge';
import { useTranslation } from '../../i18n/index';
import { pillView, type PillTone } from '../../sync/cloud-sync-status';
import { colors, fontSizes, shapeRadii, typography } from '../../theme';

const TONE_BG: Record<PillTone, string> = {
  ok: colors.green,
  busy: colors.gray600,
  warn: colors.yellow,
  danger: colors.red,
};

const TONE_FG: Record<PillTone, string> = {
  ok: colors.white,
  busy: colors.white,
  warn: colors.black,
  danger: colors.white,
};

export function CloudSyncPill(props: { readonly onOpenRejected?: () => void }): ReactElement {
  const { t } = useTranslation();
  const { state, syncNow } = useCloudSync();
  const view = pillView(state);
  const label = t(view.labelKey as never, { count: view.count, time: view.time } as never);
  const onPress =
    view.labelKey === 'syncPill.rejected' && props.onOpenRejected ? props.onOpenRejected : syncNow;
  return (
    <Pressable
      onPress={onPress}
      testID="cloud-sync-pill"
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${t('syncPill.tapToUpdate')}`}
    >
      <View
        backgroundColor={TONE_BG[view.tone]}
        borderRadius={shapeRadii.pill}
        paddingHorizontal={10}
        paddingVertical={4}
      >
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={fontSizes.xs}
          color={TONE_FG[view.tone]}
          testID={`cloud-sync-pill-${view.labelKey.split('.')[1]}`}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
