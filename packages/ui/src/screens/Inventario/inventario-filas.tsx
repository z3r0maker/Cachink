/**
 * Inventario's row (RvInventario, item 6): the product's photo square (it
 * takes the photo, M-13), then one tap target — the name with the room it
 * needs, the level bar with the threshold marked at the middle, «Aviso en
 * …», how much there is and the Reponer / Suficiente chip — that opens the
 * movement sheet. No buttons on the row: the sheet picks the kind.
 */
import type { ReactElement } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { View } from '@tamagui/core';
import { conUnidad, nivel, porReponer, type Existencia } from '@xangarro/caja/inventario';
import { GLYPHS, MText, PathIcon } from '../../components/index';
import { borderColors, borderWidths, colors, shapeRadii } from '../../theme';

/** A small chip with its tint's edge and text. */
function Pastilla(p: { texto: string; tinta: string; fondo: string }): ReactElement {
  return (
    <View
      paddingHorizontal={8}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.quiet}
      borderColor={p.tinta}
      backgroundColor={p.fondo}
    >
      <MText size="xs" weight="extraBold" color={p.tinta}>
        {p.texto}
      </MText>
    </View>
  );
}

export function EstadoChip({ e }: { readonly e: Existencia }): ReactElement {
  return porReponer(e) ? (
    <Pastilla texto="Reponer" tinta={colors.redText} fondo={colors.redSoft} />
  ) : (
    <Pastilla texto="Suficiente" tinta={colors.greenText} fondo={colors.greenSoft} />
  );
}

function Barra({ e }: { readonly e: Existencia }): ReactElement {
  return (
    <View
      aria-hidden
      position="relative"
      height={8}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.gray100}
    >
      <View
        position="absolute"
        left={0}
        top={0}
        bottom={0}
        width={`${nivel(e)}%`}
        borderRadius={shapeRadii.pill}
        backgroundColor={porReponer(e) ? colors.redText : colors.green}
      />
      <View
        position="absolute"
        left="50%"
        top={-4}
        bottom={-4}
        width={2}
        backgroundColor={colors.black}
      />
    </View>
  );
}

const filaStyle = (marcada: boolean): ViewStyle => ({
  flex: 1,
  minWidth: 0,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  minHeight: 72,
  paddingVertical: 10,
  backgroundColor: marcada ? colors.yellowSoft : colors.white,
});

function Nivel({ e }: { readonly e: Existencia }): ReactElement {
  return (
    <View flex={1} minWidth={0} gap={4} alignItems="stretch">
      <MText size="body" weight="extraBold" numberOfLines={2} textAlign="left">
        {e.nombre}
      </MText>
      <Barra e={e} />
      <MText
        size="xs"
        weight="semibold"
        color={colors.textMuted}
        fontVariant={['tabular-nums']}
        textAlign="left"
      >
        {`Aviso en ${conUnidad(e.umbral, e.unidad)}`}
      </MText>
    </View>
  );
}

/** The tap target: everything on the row but the photo square. */
export function ExistenciaFila(p: {
  readonly e: Existencia;
  readonly onPress: () => void;
}): ReactElement {
  const { e } = p;
  const hay = conUnidad(e.existencias, e.unidad);
  return (
    <Pressable
      testID={`inventario-fila-${e.id}`}
      role="button"
      aria-label={`${e.nombre}, hay ${hay}${porReponer(e) ? ', reponer' : ''}. Registrar un movimiento`}
      onPress={p.onPress}
      style={({ pressed }) => filaStyle(pressed)}
    >
      <Nivel e={e} />
      <View alignItems="flex-end" gap={4}>
        <MText
          size="lgx"
          weight="extraBold"
          fontVariant={['tabular-nums']}
          testID={`inventario-cantidad-${e.id}`}
        >
          {hay}
        </MText>
        <EstadoChip e={e} />
      </View>
      <PathIcon d={GLYPHS.chevronRight} size={18} strokeWidth={2.4} color={colors.textMuted} />
    </Pressable>
  );
}
