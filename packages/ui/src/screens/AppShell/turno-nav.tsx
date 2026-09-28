/**
 * How Mi turno (and, until M-06, Inicio) open the rest of the caja
 * (MvTurno): the big rows to the stack routes that are not tabs, and the
 * phone's «Bloquear la caja» bar in the thumb zone.
 *
 * Each row keeps the `otros-<key>` testID the Maestro flows already address
 * (the rename is A-15).
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { ICONS } from '@xangarro/caja';
import { Btn, GLYPHS, NavRows, PathIcon, type NavRowItem } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { borderColors, borderWidths, colors } from '../../theme';
import { NAV } from './tab-definitions';
import { useCajaLayout } from './use-caja-layout';

/** Where each row goes: the app's stack routes. */
export const TURNO_ROUTES = {
  gastos: NAV.gastos.path,
  inventario: NAV.inventario.path,
  movimientos: '/caja-movimientos',
  pendientes: '/no-enviados',
  ajustes: '/settings',
} as const;

function useRows(onNavigate: (path: string) => void): NavRowItem[] {
  const { t } = useTranslation();
  const row = (
    key: keyof typeof TURNO_ROUTES,
    testKey: string,
    icon: string,
    tint: string,
  ): NavRowItem => ({
    key,
    title: t(`shell.turno.${key}`),
    detail: t(`shell.turno.${key}Detalle`),
    icon,
    tint,
    onPress: () => onNavigate(TURNO_ROUTES[key]),
    testID: `otros-${testKey}`,
  });
  return [
    row('gastos', 'gastos', ICONS.gastos, colors.redSoft),
    row('inventario', 'inventario', ICONS.inventario, colors.blueSoft),
    row('movimientos', 'caja-movimientos', GLYPHS.movimientos, colors.yellowSoft),
    row('pendientes', 'no-enviados', GLYPHS.nube, colors.greenSoft),
    row('ajustes', 'configuracion', GLYPHS.ajustes, colors.gray100),
  ];
}

export function TurnoRows(props: { readonly onNavigate: (path: string) => void }): ReactElement {
  const { t } = useTranslation();
  return (
    <NavRows testID="turno-rows" label={t('shell.turno.rows')} items={useRows(props.onNavigate)} />
  );
}

/** The phone's foot on Mi turno; on a tablet the rail and sidebar carry the lock. */
export function LockBar(props: { readonly onLock: () => void }): ReactElement | null {
  const { t } = useTranslation();
  if (useCajaLayout() !== 'phone') return null;
  return (
    <View
      flexDirection="row"
      paddingHorizontal={16}
      paddingVertical={12}
      backgroundColor={colors.gray200}
      borderTopWidth={borderWidths.quiet}
      borderTopColor={borderColors.quiet}
    >
      <Btn
        variant="secondary"
        size="xl"
        fullWidth
        onPress={props.onLock}
        testID="turno-bloquear"
        icon={<PathIcon d={ICONS.lock} size={18} strokeWidth={2.2} />}
      >
        {t('shell.turno.bloquear')}
      </Btn>
    </View>
  );
}
