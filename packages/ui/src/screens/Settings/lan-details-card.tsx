/**
 * LanDetailsCard — LAN-mode Settings panel (P1D-M4 C19).
 *
 * Shows the paired server URL, the current connected-device count, and a
 * "Desemparejar este dispositivo" button. On desktop (host), a
 * "Detener servidor local" button also appears.
 *
 * Pure UI — takes props from the owning route. The route wires
 * `useLanSync().connectedDevices` + `clearSyncState(db)` for unpair.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Card, Tag } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface LanDetailsCardProps {
  readonly serverUrl: string | null;
  readonly connectedDevices: number;
  readonly isHost: boolean;
  readonly onUnpair: () => void;
  readonly onStopHostServer?: () => void;
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

function Row({ label, value, t }: { label: string; value: string; t: T }): ReactElement {
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
        fontSize={14}
        color={colors.black}
        numberOfLines={1}
      >
        {value || t('settings.lanNoConfig')}
      </Text>
    </View>
  );
}

export function LanDetailsCard(props: LanDetailsCardProps): ReactElement {
  const { t } = useTranslation();
  return (
    <Card testID={props.testID ?? 'settings-lan-card'} padding="md" fullWidth>
      <View flexDirection="row" alignItems="center" gap={8} marginBottom={8}>
        <Tag variant="success">{t('settings.lanMode')}</Tag>
        {props.isHost && <Tag variant="info">{t('settings.lanHostRole')}</Tag>}
      </View>
      <Row label={t('settings.lanServerUrl')} value={props.serverUrl ?? ''} t={t} />
      <Row label={t('settings.lanDevices')} value={String(props.connectedDevices)} t={t} />
      <View gap={8} marginTop={12}>
        {props.isHost && props.onStopHostServer && (
          <Btn
            variant="soft"
            onPress={props.onStopHostServer}
            fullWidth
            testID="settings-lan-stop-host"
          >
            {t('settings.lanStopHost')}
          </Btn>
        )}
        <Btn variant="danger" onPress={props.onUnpair} fullWidth testID="settings-lan-unpair">
          {t('settings.lanUnpair')}
        </Btn>
      </View>
    </Card>
  );
}
