/**
 * The caja's headers (MvTurno, OpTopbar; the web's `OperadorHeader`).
 *
 * - `CajaHeader`, the phone's: 64 px, white, the quiet rule under it. The
 *   caja badge (or the way back on a detail screen), then the sync pill and
 *   the avisos bell.
 * - `CajaTopbar`, the tablet's beside the rail or the sidebar: 72 px on the
 *   page, the day (or the way back), then the same pill and bell.
 *
 * `status` follows the web's `headerFor`: `full` (pill + bell), `static`
 * (a pill that is not a button, Pendientes and Cierre) or `none`.
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { formatDateLong, type IsoDate } from '@xangarro/domain';
import { hoyLocal } from '@xangarro/caja';
import { borderColors, borderWidths, colors, portalFontSizes, typography } from '../../theme';
import { useTranslation } from '../../i18n/index';
import { AvisosBell, type AvisosSource } from './avisos-bell';
import { BackButton, CajaBadge } from './app-shell-left-slot';
import { CloudSyncPill } from './cloud-sync-pill';
import type { ShellData } from './use-shell-data';

export type HeaderStatus = 'full' | 'static' | 'none';

export interface HeaderBack {
  readonly label: string;
  readonly ariaLabel?: string;
  readonly onPress: () => void;
}

export interface CajaHeaderProps {
  readonly data: ShellData;
  readonly back?: HeaderBack;
  readonly status: HeaderStatus;
  readonly avisos?: AvisosSource;
  /** Registros por enviar, where the pill leads. */
  readonly onOpenPendientes: () => void;
}

function Right(p: CajaHeaderProps): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={8}>
      {p.status === 'none' ? null : (
        <CloudSyncPill onOpenPendientes={p.onOpenPendientes} interactive={p.status === 'full'} />
      )}
      {p.status === 'full' && p.avisos ? <AvisosBell {...p.avisos} /> : null}
    </View>
  );
}

export function CajaHeader(props: CajaHeaderProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      testID="app-header"
      role="banner"
      height={64}
      paddingHorizontal={16}
      flexDirection="row"
      alignItems="center"
      gap={8}
      backgroundColor={colors.white}
      borderBottomWidth={borderWidths.quiet}
      borderBottomColor={borderColors.quiet}
    >
      {props.back ? (
        <BackButton
          onPress={props.back.onPress}
          label={props.back.label}
          ariaLabel={props.back.ariaLabel}
        />
      ) : (
        <CajaBadge
          caja={props.data.caja ?? t('shell.cajaSinNombre')}
          negocio={props.data.negocio}
        />
      )}
      <Right {...props} />
    </View>
  );
}

/** «Jueves, 14 de mayo de 2026»: the day, on the device's clock. */
function hoyLargo(): string {
  const s = formatDateLong(hoyLocal() as IsoDate);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function CajaTopbar(props: CajaHeaderProps): ReactElement {
  return (
    <View
      testID="app-header"
      role="banner"
      height={72}
      paddingHorizontal={28}
      flexDirection="row"
      alignItems="center"
      gap={12}
      backgroundColor={colors.gray200}
      borderBottomWidth={borderWidths.quiet}
      borderBottomColor={colors.gray400}
    >
      {props.back ? (
        <BackButton
          onPress={props.back.onPress}
          label={props.back.label}
          ariaLabel={props.back.ariaLabel}
        />
      ) : (
        <Text
          flex={1}
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={portalFontSizes.md}
          color={colors.gray600}
        >
          {hoyLargo()}
        </Text>
      )}
      <Right {...props} />
    </View>
  );
}
