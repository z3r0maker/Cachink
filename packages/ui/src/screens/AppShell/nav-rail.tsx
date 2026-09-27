/**
 * The 88 px icon rail, 760 to 1279 px (TbCobrar): the caja tile with its turno
 * dot, the grouped destinations (glyph over a 12 px label), and at the foot
 * whoever holds the turno with «Bloquear» and «Cerrar».
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { ICONS } from '@xangarro/caja';
import { GLYPHS, GlyphSquare, InicialesBadge, MText, PathIcon } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { CajaTile } from './app-shell-left-slot';
import { NavGroups, TurnoDot, type NavMenuProps } from './nav-parts';

export type { NavMenuProps } from './nav-parts';

const CERRAR = {
  width: 56,
  height: 52,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  borderRadius: radii[2],
  backgroundColor: colors.black,
} as const;

function RailCaja(p: NavMenuProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      width={72}
      paddingTop={8}
      paddingBottom={6}
      alignItems="center"
      gap={4}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.offwhite}
    >
      <View>
        <CajaTile size={30} glyph={16} />
        <View position="absolute" top={-4} right={-4}>
          <TurnoDot abierto={p.data.turnoDesde !== null} />
        </View>
      </View>
      <MText size="xs" weight="extraBold" numberOfLines={1}>
        {p.data.caja ?? t('shell.cajaSinNombre')}
      </MText>
    </View>
  );
}

function RailFoot(p: NavMenuProps): ReactElement {
  const { t } = useTranslation();
  const o = p.data.operador;
  return (
    <View
      marginTop="auto"
      width={72}
      paddingVertical={8}
      alignItems="center"
      gap={6}
      borderRadius={radii[4]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.yellowSoft}
    >
      {o ? <InicialesBadge iniciales={o.iniciales} size={40} label={o.nombre} /> : null}
      {p.onLock ? (
        <GlyphSquare
          d={ICONS.lock}
          label={t('shell.turno.bloquear')}
          onPress={p.onLock}
          testID="rail-bloquear"
        />
      ) : null}
      <Pressable
        testID="rail-cerrar"
        role="button"
        aria-label={t('shell.turno.cerrarTurno')}
        onPress={p.onCloseTurno}
        style={CERRAR}
      >
        <PathIcon d={GLYPHS.salir} size={18} strokeWidth={2.2} color={colors.yellow} />
        <MText size="xs" weight="extraBold" color={colors.white}>
          {t('shell.turno.cerrar')}
        </MText>
      </Pressable>
    </View>
  );
}

function Separator(): ReactElement {
  return <View width={40} height={borderWidths.quiet} backgroundColor={borderColors.quiet} />;
}

export function NavRail(props: NavMenuProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      testID="nav-rail"
      role="navigation"
      aria-label={t('shell.nav.menu')}
      width={88}
      paddingVertical={14}
      paddingHorizontal={8}
      alignItems="center"
      gap={10}
      backgroundColor={colors.white}
      borderRightWidth={borderWidths.thin}
      borderRightColor={colors.black}
    >
      <RailCaja {...props} />
      <NavGroups {...props} kind="rail" divider={(_g, i) => (i > 0 ? <Separator /> : null)} />
      <RailFoot {...props} />
    </View>
  );
}
