/**
 * CloudSyncPill — the header's sync state (A-07), in the web caja's words
 * and look (`operador/shell/header.tsx`): a pill with the black edge and a
 * dot, green «Enviado» when everything reached the server, amber «N sin
 * enviar» while records wait (offline or queued), red «N no enviados» when
 * the server refused some.
 *
 * Tapping it sends now («Actualizar»); with refused rows it opens «No
 * enviados» (A-08) where a person can act. `interactive={false}` is the
 * static pill the web shows on Pendientes and Cierre.
 */

import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { MText } from '../../components/index';
import { useCloudSync } from '../../app/cloud-sync-bridge';
import { useTranslation } from '../../i18n/index';
import { pillView, type PillTone, type PillView } from '../../sync/cloud-sync-status';
import { borderWidths, colors, shapeRadii } from '../../theme';

const GROUND: Record<PillTone, string> = {
  ok: colors.greenSoft,
  busy: colors.gray100,
  warn: colors.warningSoft,
  danger: colors.redSoft,
};

const DOT: Record<PillTone, string> = {
  ok: colors.green,
  busy: colors.gray400,
  warn: colors.warning,
  danger: colors.red,
};

export interface CloudSyncPillProps {
  readonly onOpenRejected?: () => void;
  readonly interactive?: boolean;
}

function PillBody({ view, label }: { view: PillView; label: string }): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={6}
      height={32}
      paddingHorizontal={10}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={GROUND[view.tone]}
    >
      <View
        width={11}
        height={11}
        borderRadius={shapeRadii.pill}
        borderWidth={borderWidths.thin}
        borderColor={colors.black}
        backgroundColor={DOT[view.tone]}
      />
      <MText
        size="xs"
        weight="extraBold"
        numberOfLines={1}
        testID={`cloud-sync-pill-${view.labelKey.split('.')[1]}`}
      >
        {label}
      </MText>
    </View>
  );
}

export function CloudSyncPill(props: CloudSyncPillProps): ReactElement {
  const { t } = useTranslation();
  const { state, syncNow } = useCloudSync();
  const view = pillView(state);
  const label = t(view.labelKey as never, { count: view.count, time: view.time } as never);
  const body = <PillBody view={view} label={label} />;
  if (props.interactive === false) {
    return (
      <View testID="cloud-sync-pill" role="status" aria-label={label}>
        {body}
      </View>
    );
  }
  const rejected = view.labelKey === 'syncPill.rejected' && props.onOpenRejected !== undefined;
  const hint = rejected ? t('syncPill.openRejected') : t('syncPill.tapToUpdate');
  return (
    <Pressable
      onPress={rejected ? props.onOpenRejected : syncNow}
      testID="cloud-sync-pill"
      role="button"
      aria-label={`${label}. ${hint}`}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
    >
      {body}
    </Pressable>
  );
}
