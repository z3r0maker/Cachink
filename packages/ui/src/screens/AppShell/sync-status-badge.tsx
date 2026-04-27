/**
 * SyncStatusBadge — status chip on the right slot of the TopBar.
 *
 * Local-standalone / tablet-only modes show nothing — no network, no
 * conflicts, no sync to surface. LAN and Cloud modes show a live status
 * chip fed by a `LanSyncSnapshot` (P1D-M4 C18) or a future `CloudSyncSnapshot`.
 *
 * Variants (colour + copy):
 *   - `online`     → green / "Sincronizado · N dispositivos"
 *   - `syncing`    → yellow / "Sincronizando…"
 *   - `offline`    → red-soft / "Sin conexión · Reintentando"  + retry btn
 *   - `error`      → red / "Error de sincronización"
 *   - `connecting` → yellow / "Sincronizando…"
 *
 * When `onRetry` is provided and status is offline/error, a tiny "Reintentar"
 * pill appears next to the chip. The consumer (AppShell) wires this to
 * `useLanSync().retryNow`.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { AppMode } from '../../app-config/index';
import type { LanSyncStatus } from '../../sync/index';
import { useTranslation } from '../../i18n/index';
import { colors, radii, typography } from '../../theme';
import { Btn } from '../../components/Btn/btn';

export interface SyncStatusBadgeProps {
  readonly mode: AppMode | null;
  readonly lanStatus?: LanSyncStatus;
  readonly connectedDevices?: number;
  readonly onRetry?: () => void;
}

interface Variant {
  readonly bg: string;
  readonly label: string;
}

export function SyncStatusBadge(props: SyncStatusBadgeProps): ReactElement | null {
  const { t } = useTranslation();
  if (props.mode === null || props.mode === 'local') {
    return null;
  }
  if (props.mode === 'cloud') {
    return renderChip({ bg: colors.greenSoft, label: t('topBar.syncCloud') });
  }
  // mode is 'lan-server' or 'lan-client' — both render the LAN chip.
  const variant = lanVariant(props.lanStatus ?? 'idle', props.connectedDevices ?? 0, t);
  return renderChip(variant, props.onRetry, t);
}

function lanVariant(
  status: LanSyncStatus,
  devices: number,
  t: ReturnType<typeof useTranslation>['t'],
): Variant {
  switch (status) {
    case 'online':
      return {
        bg: colors.greenSoft,
        label: t('topBar.syncLanWithCount', { count: devices }),
      };
    case 'syncing':
    case 'connecting':
      return { bg: colors.yellowSoft, label: t('topBar.syncConnecting') };
    case 'offline':
      return { bg: colors.redSoft, label: t('topBar.syncOfflineRetrying') };
    case 'error':
      return { bg: colors.redSoft, label: t('topBar.syncError') };
    case 'idle':
    default:
      return { bg: colors.gray200, label: t('topBar.syncLan') };
  }
}

function renderChip(
  variant: Variant,
  onRetry?: () => void,
  t?: ReturnType<typeof useTranslation>['t'],
): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={6}>
      <View
        testID="sync-status-badge"
        backgroundColor={variant.bg}
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
          {variant.label}
        </Text>
      </View>
      {onRetry && t && <RetryPill onPress={onRetry} label={t('topBar.retryNow')} />}
    </View>
  );
}

interface RetryPillProps {
  readonly onPress: () => void;
  readonly label: string;
}

function RetryPill(props: RetryPillProps): ReactElement {
  return (
    <View testID="sync-status-retry">
      <Btn variant="primary" size="sm" onPress={props.onPress}>
        {props.label}
      </Btn>
    </View>
  );
}
