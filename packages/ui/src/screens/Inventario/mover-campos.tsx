/**
 * The movement sheets' fields (M-09, the board's dialog): the product
 * picked from the catalogue (search + options with their stock), the
 * quantity, then «¿Qué le pasó?» for a merma or «Proveedor (opcional)» for
 * an entrada, the note that says who the move stays with, and the footer
 * both sheets save with. Shared by «Entrada de mercancía» and «Registrar
 * merma».
 */
import type { ReactElement, ReactNode } from 'react';
import { Pressable, ScrollView, TextInput, type ViewStyle } from 'react-native';
import { View } from '@tamagui/core';
import { MOTIVOS_MERMA, conUnidad, type MotivoMerma } from '@xangarro/caja/inventario';
import { Chip } from '../../components/Chip/index';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { PathIcon } from '../../components/PathIcon/index';
import {
  borderColors,
  borderWidths,
  colors,
  portalFontSizes,
  radii,
  typography,
} from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';
import type { MoverForm } from './use-mover-form';

const CAMPO = {
  height: 52,
  paddingHorizontal: 14,
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  backgroundColor: colors.white,
  fontFamily: typography.fontFamily,
  fontWeight: '700',
  fontSize: portalFontSizes.lg,
  color: colors.black,
} as const;

function Campo(p: { readonly label: string; readonly children: ReactNode }): ReactElement {
  return (
    <View gap={6}>
      <Eyebrow color={colors.gray600}>{p.label}</Eyebrow>
      {p.children}
    </View>
  );
}

function Opcion(p: {
  readonly nombre: string;
  readonly qty: string;
  readonly sel: boolean;
  readonly onPress: () => void;
}): ReactElement {
  const style: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    minHeight: 52,
    paddingHorizontal: 13,
    borderRadius: radii[3],
    borderWidth: p.sel ? borderWidths.thick : borderWidths.quiet,
    borderColor: p.sel ? colors.black : borderColors.quiet,
    backgroundColor: p.sel ? colors.yellowSoft : colors.white,
  };
  return (
    <Pressable
      testID={`mover-producto-${p.nombre}`}
      role="radio"
      aria-checked={p.sel}
      accessibilityLabel={p.nombre}
      onPress={p.onPress}
      style={style}
    >
      <MText flex={1} size="md" weight="extraBold">
        {p.nombre}
      </MText>
      <MText size="sm" weight="bold" fontVariant={['tabular-nums']} color={colors.gray600}>
        {p.qty}
      </MText>
    </Pressable>
  );
}

/** The picker's search box, over the catalogue the sheet offers. */
function BuscadorCatalogo(f: MoverForm): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={10}
      height={48}
      paddingHorizontal={13}
      borderRadius={radii[3]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <PathIcon d={COBRAR_GLYPHS.buscar} size={17} strokeWidth={2.4} color={colors.gray600} />
      <TextInput
        testID="mover-buscar"
        aria-label="Buscar en el catálogo"
        placeholder="Buscar en el catálogo"
        placeholderTextColor={colors.textMuted}
        value={f.query}
        onChangeText={f.setQuery}
        style={{
          flex: 1,
          height: 44,
          fontFamily: typography.fontFamily,
          fontWeight: '600',
          fontSize: portalFontSizes.body,
          color: colors.black,
        }}
      />
    </View>
  );
}

/** The catalogue picker: search, the options with their stock, or nothing. */
export function ProductoCampo(f: MoverForm): ReactElement {
  return (
    <Campo label="Producto">
      <BuscadorCatalogo {...f} />
      <View gap={8} maxHeight={210}>
        <ScrollView nestedScrollEnabled>
          <View gap={8}>
            {f.opciones.map((it) => (
              <Opcion
                key={it.id}
                nombre={it.nombre}
                qty={conUnidad(it.existencias, it.unidad)}
                sel={f.productoId === it.id}
                onPress={() => f.setProductoId(it.id)}
              />
            ))}
            {f.opciones.length === 0 ? (
              <MText
                size="md"
                weight="bold"
                color={colors.gray600}
                padding={14}
                testID="mover-sin-resultados"
              >
                Nada coincide con esa búsqueda.
              </MText>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Campo>
  );
}

export function CantidadCampo(f: MoverForm): ReactElement {
  return (
    <Campo label="Cantidad">
      <TextInput
        testID="mover-cantidad"
        aria-label="Cantidad"
        inputMode="numeric"
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        value={f.raw}
        onChangeText={f.setRaw}
        style={{ ...CAMPO, fontSize: portalFontSizes.xl3, fontWeight: '800' }}
      />
    </Campo>
  );
}

/** A write-off always says what happened (the register's four reasons). */
export function MotivoCampo(f: MoverForm): ReactElement {
  return (
    <Campo label="Motivo">
      <View role="radiogroup" aria-label="Motivo" flexDirection="row" flexWrap="wrap" gap={8}>
        {MOTIVOS_MERMA.map((m: MotivoMerma) => (
          <Chip
            key={m}
            label={m}
            selected={f.motivo === m}
            onPress={() => f.setMotivo(m)}
            testID={`mover-motivo-${m}`}
          />
        ))}
      </View>
    </Campo>
  );
}

export function ProveedorCampo(f: MoverForm): ReactElement {
  return (
    <Campo label="Proveedor (opcional)">
      <TextInput
        testID="mover-proveedor"
        aria-label="Proveedor (opcional)"
        placeholder="Carnicería La Central"
        placeholderTextColor={colors.textMuted}
        value={f.proveedor}
        onChangeText={f.setProveedor}
        style={CAMPO}
      />
    </Campo>
  );
}
