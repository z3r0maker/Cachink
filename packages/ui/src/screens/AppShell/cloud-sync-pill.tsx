/**
 * CloudSyncPill — the header's sync state (A-07), in the web caja's words
 * and look (`operador/shell/header.tsx`): a pill with the black edge and a
 * dot, green «Enviado» when everything reached the server, amber «N sin
 * enviar» while records wait (offline or queued), red «N no enviados» when
 * the server refused some, and «Reintentando en 1 min» in the warning ink
 * with a clock while the engine waits on a busy server (DS-05,
 * EsMvReintentando; «Reintento: 7:42 p. m.» when the server said when).
 *
 * In the caja's frame it opens Registros por enviar (MvPendientes, M-09):
 * the queue, its «Reintentar ahora» and the refused rows. Without that
 * destination it sends now («Actualizar»), or opens «No enviados» (A-08) when
 * the server refused some. `interactive={false}` is the static pill the web
 * shows on Pendientes and Cierre.
 */

import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { MText, PathIcon } from '../../components/index';
import { useAhora } from '../../hooks/use-ahora';
import { useCloudSync } from '../../app/cloud-sync-bridge';
import { useTranslation } from '../../i18n/index';
import { pillView, type PillTone, type PillView } from '../../sync/cloud-sync-status';
import { borderWidths, colors, shapeRadii } from '../../theme';

const GROUND: Record<PillTone, string> = {
  ok: colors.greenSoft,
  busy: colors.gray100,
  warn: colors.warningSoft,
  retry: colors.warningSoft,
  danger: colors.redSoft,
};

const DOT: Record<PillTone, string> = {
  ok: colors.green,
  busy: colors.gray400,
  warn: colors.warning,
  retry: colors.warning,
  danger: colors.red,
};

/** Lucide `clock`: the engine waits and goes again by itself. */
const RELOJ = 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7v5l3 2';

export interface CloudSyncPillProps {
  /** Registros por enviar: when present, the pill always opens it. */
  readonly onOpenPendientes?: () => void;
  readonly onOpenRejected?: () => void;
  readonly interactive?: boolean;
}

function Marca({ view }: { view: PillView }): ReactElement {
  if (view.tone === 'retry')
    return <PathIcon d={RELOJ} size={14} strokeWidth={2.6} color={colors.warningText} />;
  return (
    <View
      width={11}
      height={11}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={DOT[view.tone]}
    />
  );
}

function PillBody({ view, label }: { view: PillView; label: string }): ReactElement {
  const retry = view.tone === 'retry';
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={6}
      height={32}
      paddingHorizontal={10}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={retry ? colors.warningText : colors.black}
      backgroundColor={GROUND[view.tone]}
    >
      <Marca view={view} />
      <MText
        size="xs"
        weight="extraBold"
        color={retry ? colors.warningText : undefined}
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
  const ahora = useAhora(state.reintento != null && state.counts.unsent > 0);
  const view = pillView(state, ahora);
  const label =
    view.texto ?? t(view.labelKey as never, { count: view.count, time: view.time } as never);
  const body = <PillBody view={view} label={label} />;
  if (props.interactive === false) {
    return (
      <View testID="cloud-sync-pill" role="status" aria-label={label}>
        {body}
      </View>
    );
  }
  const rejected = view.labelKey === 'syncPill.rejected' && props.onOpenRejected !== undefined;
  const abrir = props.onOpenPendientes ?? (rejected ? props.onOpenRejected : undefined);
  const hint = props.onOpenPendientes
    ? t('syncPill.openPendientes')
    : rejected
      ? t('syncPill.openRejected')
      : t('syncPill.tapToUpdate');
  return (
    <Pressable
      onPress={abrir ?? syncNow}
      testID="cloud-sync-pill"
      role="button"
      aria-label={`${label}. ${hint}`}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
    >
      {body}
    </Pressable>
  );
}
