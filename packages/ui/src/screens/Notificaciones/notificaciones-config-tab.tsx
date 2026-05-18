/**
 * NotificacionesConfigTab — Director preference toggles for each
 * alert source, grouped by category.
 *
 * Feature-locked sources show a disabled switch with a hint.
 *
 * Phase 11 — Director Notification Inbox.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { Text } from '@tamagui/core';
import { isSourceLocked, type NotificationPreferences } from '@cachink/domain';
import type { FeatureFlags } from '@cachink/domain';
import { SectionTitle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_SOURCE_INFO,
} from './notification-source-info';
import { NotificationToggleCard } from './notification-toggle-card';
import { FLAG_DISPLAY_INFO } from '../FuncionesNegocio/flag-descriptions';

export interface NotificacionesConfigTabProps {
  readonly prefs: NotificationPreferences;
  readonly flags: FeatureFlags;
  readonly onToggle: (source: string, newValue: boolean) => void;
  readonly testID?: string;
}

function featureLabelForFlag(flagKey: string, t: (k: never) => string): string {
  const info = FLAG_DISPLAY_INFO.find((f) => f.key === flagKey);
  return info ? t(info.labelKey as never) : flagKey;
}

export function NotificacionesConfigTab(props: NotificacionesConfigTabProps): ReactElement {
  const { prefs, flags, onToggle, testID } = props;
  const { t } = useTranslation();

  return (
    <View testID={testID ?? 'notificaciones-config-tab'} gap={16}>
      <Text
        fontFamily={typography.fontFamily}
        fontSize={14}
        color={colors.gray600}
      >
        {t('notificaciones.configSubtitle')}
      </Text>

      {NOTIFICATION_CATEGORIES.map((cat) => {
        const items = NOTIFICATION_SOURCE_INFO.filter((s) => s.category === cat.key);
        if (items.length === 0) return null;

        return (
          <View key={cat.key} gap={10}>
            <SectionTitle title={t(cat.labelKey as never)} />
            {items.map((info) => {
              const locked = isSourceLocked(info.source, flags);
              const lockedHint = locked && info.featureFlag
                ? t('notificaciones.requiereHint' as never, {
                    feature: featureLabelForFlag(info.featureFlag, t),
                  })
                : null;

              return (
                <NotificationToggleCard
                  key={info.source}
                  info={info}
                  enabled={locked ? false : (prefs[info.source] ?? true)}
                  locked={locked}
                  lockedHint={lockedHint}
                  onToggle={(v) => onToggle(info.source, v)}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );
}
