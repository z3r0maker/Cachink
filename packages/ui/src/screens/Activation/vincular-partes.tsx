/**
 * The pieces MvVincular's two views share: the yellow brand head and the
 * white head with «‹ Escanear», the «Sin conectar» chip, the numbered step,
 * the amber note, the aviso de privacidad (N-34, variante B: shown, never a
 * checkbox) and the white foot that holds the action in the thumb zone.
 */
import type { ReactElement, ReactNode } from 'react';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { View } from '@tamagui/core';
import { AVISO_VINCULACION } from '@xangarro/domain';
import { GLYPHS, MText, PathIcon, SafeAreaSpacer } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { borderColors, borderWidths, colors, radii, shadows, shapeRadii } from '../../theme';

const MARCA =
  'M287 352 L414 331 L503 437 L597 310 L697 291 L576 508 L735 675 L584 693 L503 586 L432 701 L315 711 L436 513 Z';
const RELOJ = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2';

export function SinConectar(): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      height={32}
      justifyContent="center"
      paddingHorizontal={12}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <MText size="xs" weight="extraBold">
        {t('entrar.vincular.sinConectar')}
      </MText>
    </View>
  );
}

function Cabeza(props: { amarilla: boolean; children: ReactNode }): ReactElement {
  return (
    <View backgroundColor={props.amarilla ? colors.yellow : colors.white}>
      <SafeAreaSpacer />
      <View
        flexDirection="row"
        alignItems="center"
        gap={10}
        height={64}
        paddingHorizontal={16}
        borderBottomWidth={props.amarilla ? borderWidths.thick : borderWidths.quiet}
        borderBottomColor={props.amarilla ? colors.black : borderColors.quiet}
      >
        {props.children}
        <SinConectar />
      </View>
    </View>
  );
}

export function CabezaMarca(): ReactElement {
  return (
    <Cabeza amarilla>
      <View
        width={40}
        height={40}
        alignItems="center"
        justifyContent="center"
        borderRadius={shapeRadii.pill}
        borderWidth={borderWidths.thick}
        borderColor={colors.black}
        backgroundColor={colors.yellow}
        style={{ boxShadow: shadows.pressed }}
      >
        <Svg width={22} height={22} viewBox="281 271 460 460" aria-hidden>
          <Path d={MARCA} fill={colors.black} />
        </Svg>
      </View>
      <MText flex={1} size="xl5" weight="black" letterSpacing={0.3}>
        XANGARRO!
      </MText>
    </Cabeza>
  );
}

export function CabezaVolver(props: { etiqueta: string; onPress: () => void }): ReactElement {
  return (
    <Cabeza amarilla={false}>
      <Pressable
        testID="vincular-escanear"
        role="button"
        aria-label={props.etiqueta}
        onPress={props.onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          height: 44,
          paddingLeft: 8,
          paddingRight: 14,
          borderRadius: radii[2],
          borderWidth: borderWidths.quiet,
          borderColor: borderColors.quiet,
          backgroundColor: colors.white,
        }}
      >
        <PathIcon d={GLYPHS.chevronLeft} size={20} strokeWidth={2.4} />
        <MText size="body" weight="extraBold">
          {props.etiqueta}
        </MText>
      </Pressable>
      <View flex={1} />
    </Cabeza>
  );
}

export function Paso(props: { n: number; hecho: boolean; children: ReactNode }): ReactElement {
  return (
    <View flexDirection="row" gap={12}>
      <View
        width={28}
        height={28}
        alignItems="center"
        justifyContent="center"
        borderRadius={shapeRadii.pill}
        borderWidth={borderWidths.thin}
        borderColor={colors.black}
        backgroundColor={props.hecho ? colors.yellow : colors.white}
        aria-hidden
      >
        <MText size="sm" weight="extraBold">
          {props.n}
        </MText>
      </View>
      <View flex={1} minWidth={0} gap={8}>
        {props.children}
      </View>
    </View>
  );
}

export function NotaAmbar({ texto }: { texto: string }): ReactElement {
  return (
    <View
      role="note"
      flexDirection="row"
      alignItems="flex-start"
      gap={10}
      paddingHorizontal={12}
      paddingVertical={10}
      borderRadius={radii[3]}
      borderWidth={borderWidths.thin}
      borderColor={colors.warningText}
      backgroundColor={colors.warningSoft}
    >
      <PathIcon d={RELOJ} size={18} strokeWidth={2.2} color={colors.warningText} />
      <MText flex={1} size="sm" weight="bold">
        {texto}
      </MText>
    </View>
  );
}

/** N-34 variante B: the aviso is read here; its version travels with the request. */
export function AvisoVinculacion(): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      gap={4}
      padding={12}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.white}
    >
      <MText size="body" weight="extraBold">
        {t('entrar.vincular.aviso')}
      </MText>
      <MText testID="activation-aviso" size="sm" weight="semibold" color={colors.gray600}>
        {AVISO_VINCULACION.join(' ')}
      </MText>
    </View>
  );
}

export function Pie({ children }: { children: ReactNode }): ReactElement {
  const insets = useSafeAreaInsets();
  return (
    <View
      gap={6}
      paddingHorizontal={16}
      paddingTop={12}
      paddingBottom={Math.max(16, insets.bottom)}
      backgroundColor={colors.white}
      borderTopWidth={borderWidths.quiet}
      borderTopColor={borderColors.quiet}
    >
      {children}
    </View>
  );
}
