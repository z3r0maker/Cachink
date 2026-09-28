/**
 * The pieces of MvAcceso: the yellow head where Don greets, the caja chip
 * beside the date, one row per operator (a radio), and «¿Olvidaste tu NIP?»,
 * which opens a note instead of doing anything: only the owner changes a NIP.
 */
import { useState, type ReactElement } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { View } from '@tamagui/core';
import { ICONS } from '@xangarro/caja';
import { GLYPHS, InicialesBadge, MText, PathIcon } from '../../components/index';
import { DonBurbuja } from '../../components/Don/don-burbuja';
import { useTranslation } from '../../i18n/index';
import { borderColors, borderWidths, colors, radii, shadows, shapeRadii } from '../../theme';

export interface AccesoOperador {
  readonly id: string;
  readonly nombre: string;
  readonly iniciales: string;
  /** «Turno abierto desde las 08:15», when this person holds the open turno. */
  readonly detalle?: string;
}

export function CabezaDon({ texto }: { texto: string }): ReactElement {
  return (
    <View
      height={104}
      justifyContent="flex-end"
      paddingLeft={10}
      paddingRight={16}
      backgroundColor={colors.yellow}
      borderBottomWidth={borderWidths.thick}
      borderBottomColor={colors.black}
    >
      <DonBurbuja pose="hola" size={92} cola="centro" testID="acceso-don">
        <MText size="lgx" weight="extraBold" letterSpacing={-0.2}>
          {texto}
        </MText>
      </DonBurbuja>
    </View>
  );
}

export function CajaChip({ texto }: { texto: string }): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={6}
      height={30}
      paddingLeft={4}
      paddingRight={10}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
      flexShrink={1}
    >
      <View
        width={22}
        height={22}
        borderRadius={shapeRadii.pill}
        backgroundColor={colors.black}
        alignItems="center"
        justifyContent="center"
      >
        <PathIcon d={ICONS.caja} size={12} strokeWidth={2.6} color={colors.yellow} />
      </View>
      <MText size="xs" weight="extraBold" numberOfLines={1} flexShrink={1}>
        {texto}
      </MText>
    </View>
  );
}

const filaEstilo = (on: boolean): ViewStyle => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  minHeight: 56,
  paddingLeft: 10,
  paddingRight: 14,
  borderRadius: radii[4],
  borderWidth: on ? borderWidths.thick : borderWidths.quiet,
  borderColor: on ? colors.black : borderColors.quiet,
  backgroundColor: on ? colors.yellowSoft : colors.white,
  boxShadow: on ? shadows.small : 'none',
});

export function OperadorFila(props: {
  readonly o: AccesoOperador;
  readonly on: boolean;
  readonly onPress: () => void;
}): ReactElement {
  const { o, on } = props;
  return (
    <Pressable
      testID={`acceso-operador-${o.id}`}
      role="radio"
      aria-checked={on}
      aria-label={o.detalle ? `${o.nombre}, ${o.detalle}` : o.nombre}
      onPress={props.onPress}
      style={filaEstilo(on)}
    >
      <InicialesBadge iniciales={o.iniciales} size={36} />
      <View flex={1} minWidth={0}>
        <MText size="body" weight="extraBold" numberOfLines={1}>
          {o.nombre}
        </MText>
        {o.detalle ? (
          <MText size="xs" weight="semibold" color={colors.gray600} numberOfLines={1}>
            {o.detalle}
          </MText>
        ) : null}
      </View>
      {on ? <PathIcon d={GLYPHS.check} size={22} strokeWidth={2.6} /> : null}
    </Pressable>
  );
}

/** «¿Olvidaste tu NIP?»: a note, since only the owner changes it. */
export function OlvideNip({ aQuien }: { aQuien: string }): ReactElement {
  const { t } = useTranslation();
  const [abierto, setAbierto] = useState(false);
  return (
    <View alignItems="center" gap={6}>
      <Pressable
        testID="acceso-olvide"
        role="button"
        aria-expanded={abierto}
        onPress={() => setAbierto(!abierto)}
        style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}
      >
        <MText size="md" weight="bold" textAlign="center" textDecorationLine="underline">
          {t('entrar.acceso.olvide', { aQuien })}
        </MText>
      </Pressable>
      {abierto ? (
        <View
          padding={12}
          borderRadius={radii[3]}
          borderWidth={borderWidths.quiet}
          borderColor={borderColors.quiet}
          backgroundColor={colors.white}
        >
          <MText size="sm" weight="semibold" color={colors.gray600}>
            {t('entrar.acceso.olvideDetalle')}
          </MText>
        </View>
      ) : null}
    </View>
  );
}
