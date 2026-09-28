/**
 * Inventario's rows (MvInventario): a stocked product (its glyph on its
 * tint, the name, the level bar with the threshold marked at the middle,
 * «Aviso en …», how much there is and the Reponer / Suficiente chip; the row
 * opens its movement sheet), and one movement of the turno (time, «Llegó
 * mercancía» or «Merma», the product, what was noted, +/− the quantity).
 */
import type { ReactElement } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { View } from '@tamagui/core';
import {
  conUnidad,
  delta,
  nivel,
  porReponer,
  type Existencia,
  type Movimiento,
} from '@xangarro/caja/inventario';
import { GLYPHS, MText, PathIcon } from '../../components/index';
import { borderColors, borderWidths, colors, shapeRadii } from '../../theme';
import { ProductoIcono } from '../Ventas/cobrar-tile';
import type { ExistenciaMovil } from './inventario-lectura';

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

const filaStyle = (marcada: boolean, ultima: boolean): ViewStyle => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  minHeight: 68,
  paddingVertical: 10,
  paddingLeft: 14,
  paddingRight: 12,
  borderBottomWidth: ultima ? 0 : 1,
  borderBottomColor: colors.gray100,
  backgroundColor: marcada ? colors.yellowSoft : colors.white,
});

function Nivel({ e }: { readonly e: ExistenciaMovil }): ReactElement {
  return (
    <View flex={1} minWidth={0} gap={4} alignItems="stretch">
      <MText size="body" weight="extraBold" numberOfLines={1} textAlign="left">
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

export function ExistenciaFila(p: {
  readonly e: ExistenciaMovil;
  readonly abierta: boolean;
  readonly ultima: boolean;
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
      style={({ pressed }) => filaStyle(pressed || p.abierta, p.ultima)}
    >
      <ProductoIcono icono={e.glifo} tint={e.tint} size={44} />
      <Nivel e={e} />
      <View alignItems="flex-end" gap={4}>
        <MText size="lgx" weight="extraBold" fontVariant={['tabular-nums']}>
          {hay}
        </MText>
        <EstadoChip e={e} />
      </View>
      <PathIcon d={GLYPHS.chevronRight} size={18} strokeWidth={2.4} color={colors.textMuted} />
    </Pressable>
  );
}

function QuePaso(p: { m: Movimiento; e: ExistenciaMovil | undefined }): ReactElement {
  const entrada = p.m.tipo === 'Entrada';
  return (
    <View flex={1} minWidth={0} gap={3}>
      <View flexDirection="row" alignItems="center" gap={6}>
        <MText size="xs" color={colors.gray600} fontVariant={['tabular-nums']}>
          {p.m.hora}
        </MText>
        {entrada ? (
          <Pastilla texto="Llegó mercancía" tinta={colors.greenText} fondo={colors.greenSoft} />
        ) : (
          <Pastilla texto="Merma" tinta={colors.redText} fondo={colors.redSoft} />
        )}
      </View>
      <MText size="body" weight="extraBold" numberOfLines={1}>
        {p.e?.nombre ?? 'Producto'}
      </MText>
      {p.m.detalle ? (
        <MText size="sm" weight="semibold" color={colors.textMuted} numberOfLines={1}>
          {p.m.detalle}
        </MText>
      ) : null}
    </View>
  );
}

export function MovimientoFila(p: {
  readonly m: Movimiento;
  readonly e: ExistenciaMovil | undefined;
  readonly ultima: boolean;
}): ReactElement {
  const entrada = p.m.tipo === 'Entrada';
  return (
    <View
      testID={`inventario-mov-${p.m.id}`}
      role="listitem"
      style={{ ...filaStyle(false, p.ultima), minHeight: 72 }}
    >
      {p.e ? <ProductoIcono icono={p.e.glifo} tint={p.e.tint} size={44} /> : null}
      <QuePaso m={p.m} e={p.e} />
      <MText
        size="lg"
        weight="extraBold"
        color={entrada ? colors.greenText : colors.redText}
        fontVariant={['tabular-nums']}
      >
        {delta(p.m, p.e?.unidad ?? 'piezas')}
      </MText>
    </View>
  );
}
