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
 *
 * «¿Algo no funciona?» (RpPuerta, M-23) opens the report sheet instead of a
 * route. It says how many reports wait on the device when some do. The web
 * caja passes no `onReportar` and has no such row.
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

const noop = (): void => undefined;

/** What Mi turno knows live about its rows; Ajustes has nothing live to say. */
export type TurnoRowsVivas = Partial<FilasTurno>;

/** «¿Algo no funciona?»: the report sheet's row, with what waits to be sent. */
function useFilaReportar(onReportar: () => void, porEnviar: number): NavRowItem {
  const { t } = useTranslation();
  const espera =
    porEnviar === 1
      ? t('reportar.filaPorEnviarUno')
      : t('reportar.filaPorEnviarVarios', { count: porEnviar });
  return {
    key: 'reportar',
    title: t('reportar.fila'),
    detail: porEnviar > 0 ? espera : t('reportar.filaDetalle'),
    icon: GLYPHS.ayuda,
    tint: colors.yellow,
    onPress: onReportar,
    testID: 'otros-reportar',
  };
}

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
  /** Opens the report sheet; the row is drawn only when this is given. */
  readonly onReportar?: () => void;
  /** Reports waiting on the device. */
  readonly reportesPorEnviar?: number;
}): ReactElement {
  const { t } = useTranslation();
  const rows = useRows(props.onNavigate, props.vivas ?? {});
  const reportar = useFilaReportar(props.onReportar ?? noop, props.reportesPorEnviar ?? 0);
  // Before «Ajustes de la caja», which stays last (RpPuerta).
  const items = props.onReportar ? [...rows.slice(0, -1), reportar, ...rows.slice(-1)] : rows;
  return <NavRows testID="turno-rows" label={t('shell.turno.rows')} items={items} />;
}
