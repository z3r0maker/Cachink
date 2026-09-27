/**
 * The full sidebar, from 1280 px (the web caja's `OperadorSidebar`, 264 px on
 * the canvas): which caja this is and whether a turno is open, the menu in
 * its three groups, and a card for whoever holds the turno with «Bloquear» and
 * «Cerrar mi turno».
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { ICONS } from '@xangarro/caja';
import { Eyebrow, GlyphSquare, InicialesBadge, MText } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { CajaTile } from './app-shell-left-slot';
import { NavGroups, TurnoDot, type NavMenuProps } from './nav-parts';

const WIDTH = 264;

const CERRAR = {
  flex: 1,
  height: 44,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii[2],
  backgroundColor: colors.black,
} as const;

function useTurnoLine(desde: string | null): string {
  const { t } = useTranslation();
  return desde ? t('shell.turno.abierto', { hora: desde }) : t('shell.turno.sinTurno');
}

function CajaPill(p: NavMenuProps): ReactElement {
  const { t } = useTranslation();
  const linea = useTurnoLine(p.data.turnoDesde);
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={10}
      minHeight={56}
      paddingHorizontal={12}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.offwhite}
    >
      <CajaTile size={32} glyph={18} />
      <View flex={1} minWidth={0}>
        <MText weight="extraBold" numberOfLines={1}>
          {p.data.caja ?? t('shell.cajaSinNombre')}
        </MText>
        {p.data.negocio ? (
          <MText size="xs" weight="semibold" color={colors.gray600} numberOfLines={1}>
            {p.data.negocio}
          </MText>
        ) : null}
      </View>
      <TurnoDot abierto={p.data.turnoDesde !== null} label={linea} />
    </View>
  );
}

function Quien(p: NavMenuProps): ReactElement {
  const o = p.data.operador;
  return (
    <View flexDirection="row" alignItems="center" gap={10}>
      {o ? <InicialesBadge iniciales={o.iniciales} size={34} /> : null}
      <View flex={1} minWidth={0}>
        {o ? (
          <MText weight="extraBold" numberOfLines={1}>
            {o.nombre}
          </MText>
        ) : null}
        <MText size="xs" weight="semibold" color={colors.gray600}>
          {useTurnoLine(p.data.turnoDesde)}
        </MText>
      </View>
    </View>
  );
}

function TurnoCard(p: NavMenuProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      gap={10}
      padding={12}
      borderRadius={radii[4]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.yellowSoft}
    >
      <Quien {...p} />
      <View flexDirection="row" gap={8}>
        {p.onLock ? (
          <GlyphSquare
            d={ICONS.lock}
            label={t('shell.turno.bloquear')}
            onPress={p.onLock}
            testID="sidebar-bloquear"
          />
        ) : null}
        <Pressable testID="sidebar-cerrar" role="button" onPress={p.onCloseTurno} style={CERRAR}>
          <MText weight="extraBold" color={colors.white}>
            {t('shell.turno.cerrarTurno')}
          </MText>
        </Pressable>
      </View>
    </View>
  );
}

export function NavSidebar(props: NavMenuProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      testID="nav-sidebar"
      role="navigation"
      aria-label={t('shell.nav.menu')}
      width={WIDTH}
      padding={12}
      gap={14}
      backgroundColor={colors.white}
      borderRightWidth={borderWidths.thick}
      borderRightColor={colors.black}
    >
      <CajaPill {...props} />
      <View flex={1} gap={14}>
        <NavGroups
          {...props}
          kind="sidebar"
          divider={(g) =>
            g.labelKey ? (
              <View paddingHorizontal={12} paddingTop={4}>
                <Eyebrow>{t(g.labelKey)}</Eyebrow>
              </View>
            ) : null
          }
        />
      </View>
      <TurnoCard {...props} />
    </View>
  );
}
