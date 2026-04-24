/**
 * SyncStatusBadge — tiny status chip on the right slot of the TopBar.
 *
 * Local-standalone mode ("solo este dispositivo") shows nothing — no
 * network, no conflicts, no sync to surface. LAN/Cloud modes get their
 * own chip in later phases (P1D/P1E) when sync wiring lands.
 *
 * Kept local to AppShell rather than promoted to `@cachink/ui/components`
 * because it depends on the AppMode union and only the shell consumes it.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { AppMode } from '../../app-config/index';
import { useTranslation } from '../../i18n/index';
import { colors, radii, typography } from '../../theme';

export interface SyncStatusBadgeProps {
  readonly mode: AppMode | null;
}

export function SyncStatusBadge({ mode }: SyncStatusBadgeProps): ReactElement | null {
  const { t } = useTranslation();
  if (mode === null || mode === 'local-standalone' || mode === 'tablet-only') {
    // Local-only: no badge — CLAUDE.md §2 principle 2 (local-first default).
    return null;
  }
  const label = mode === 'lan' ? t('topBar.syncLan') : t('topBar.syncCloud');
  return (
    <View
      testID="sync-status-badge"
      backgroundColor={colors.greenSoft}
      borderColor={colors.black}
      borderWidth={2}
      borderRadius={radii[0]}
      paddingHorizontal={10}
      paddingVertical={4}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={11}
        color={colors.black}
        letterSpacing={typography.letterSpacing.wide}
        style={{ textTransform: 'uppercase' }}
      >
        {label}
      </Text>
    </View>
  );
}
