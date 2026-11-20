/**
 * Mi turno's «Lo de tu turno» (MvTurno): the big rows to the stack routes
 * that are not tabs, each with its live line and status chip when Mi turno
 * knows them (`filasDelTurno` in `@xangarro/caja/turno`), its fixed line
 * otherwise.
 *
 * Each row keeps the `otros-<key>` testID the Maestro flows already address
 * (the rename is A-15). «Movimientos de caja» is gone (R2, approved
 * 2026-11-19): nothing records a deposit or a withdrawal yet, so it only
 * ever opened an empty list. «Ajustes de la caja» is not on the board; it
 * stays last because nothing else opens Ajustes on the phone, and Ajustes
 * holds «Privacidad y términos» (store review 5.1.1(i)).
 */
import type { ReactElement } from 'react';
import { ICONS } from '@xangarro/caja';
import type { ClaveFilaTurno, FilasTurno } from '@xangarro/caja/turno';
import { GLYPHS, NavRows, type NavRowItem } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import { NAV } from './tab-definitions';

/** Where each row goes: the app's stack routes. */
export const TURNO_ROUTES = {
  gastos: NAV.gastos.path,
  fiado: '/fiado',
  inventario: NAV.inventario.path,
  avisos: '/avisos',
  pendientes: '/no-enviados',
  ajustes: '/settings',
} as const;

type TurnoRowKey = keyof typeof TURNO_ROUTES;

/** What Mi turno knows live about its rows; Ajustes has nothing live to say. */
export type TurnoRowsVivas = Partial<FilasTurno>;

function useRows(onNavigate: (path: string) => void, vivas: TurnoRowsVivas): NavRowItem[] {
  const { t } = useTranslation();
  const row = (key: TurnoRowKey, testKey: string, icon: string, tint: string): NavRowItem => {
    const viva = key === 'ajustes' ? undefined : vivas[key as ClaveFilaTurno];
    return {
      key,
      title: t(`shell.turno.${key}`),
      detail: viva?.detail ?? t(`shell.turno.${key}Detalle`),
      ...(viva?.chip ? { chip: viva.chip } : {}),
      icon,
      tint,
      onPress: () => onNavigate(TURNO_ROUTES[key]),
      testID: `otros-${testKey}`,
    };
  };
  return [
    row('gastos', 'gastos', ICONS.gastos, colors.redSoft),
    row('fiado', 'fiado', ICONS.fiado, colors.warningSoft),
    row('inventario', 'inventario', ICONS.inventario, colors.blueSoft),
    row('avisos', 'avisos', ICONS.bell, colors.yellowSoft),
    row('pendientes', 'no-enviados', GLYPHS.nube, colors.greenSoft),
    row('ajustes', 'configuracion', GLYPHS.ajustes, colors.gray100),
  ];
}

export function TurnoRows(props: {
  readonly onNavigate: (path: string) => void;
  /** Live lines and chips (Mi turno); the fixed lines otherwise. */
  readonly vivas?: TurnoRowsVivas;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <NavRows
      testID="turno-rows"
      label={t('shell.turno.rows')}
      items={useRows(props.onNavigate, props.vivas ?? {})}
    />
  );
}
