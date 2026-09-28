/**
 * The pieces of «Producto nuevo en caja» (MvProductoNuevo): the barcode card,
 * the numbered questions and the preview of the tile with its icon picker.
 */
import type { ReactElement, ReactNode } from 'react';
import { TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { Chip } from '../../components/Chip/index';
import { Eyebrow } from '../../components/Panel/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import {
  borderColors,
  borderWidths,
  colors,
  portalFontSizes,
  radii,
  shapeRadii,
  typography,
} from '../../theme';
import { COBRAR_GLYPHS } from './cobrar-glyphs';
import type { ProductoNuevoForm } from './use-producto-nuevo';

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

export function CodigoCard({ codigo }: { codigo: string }): ReactElement {
  return (
    <View
      testID="producto-nuevo-codigo"
      flexDirection="row"
      alignItems="center"
      gap={12}
      padding={12}
      borderRadius={radii[4]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.gray100}
    >
      <PathIcon d={COBRAR_GLYPHS.escanear} size={20} />
      <View flex={1}>
        <Eyebrow>Código de barras</Eyebrow>
        <MText size="body" weight="extraBold">
          {codigo}
        </MText>
      </View>
      <MText size="sm" weight="bold" color={colors.gray600}>
        Del escáner
      </MText>
    </View>
  );
}

export function Pregunta(p: { n: number; texto: string; children: ReactNode }): ReactElement {
  return (
    <View gap={8}>
      <View flexDirection="row" alignItems="center" gap={8}>
        <View
          width={24}
          height={24}
          alignItems="center"
          justifyContent="center"
          borderRadius={shapeRadii.pill}
          backgroundColor={colors.black}
          aria-hidden
        >
          <MText size="xs" weight="extraBold" color={colors.yellow}>
            {String(p.n)}
          </MText>
        </View>
        <MText size="body" weight="extraBold">
          {p.texto}
        </MText>
      </View>
      {p.children}
    </View>
  );
}

export function Nombre({ f }: { f: ProductoNuevoForm }): ReactElement {
  return (
    <TextInput
      testID="producto-nuevo-nombre"
      aria-label="¿Cómo se llama?"
      placeholder="Por ejemplo: Orden de tripa"
      placeholderTextColor={colors.textMuted}
      value={f.nombre}
      onChangeText={f.setNombre}
      style={CAMPO}
    />
  );
}

export function Precio({ f }: { f: ProductoNuevoForm }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={8}>
      <MText size="xl2" weight="extraBold">
        $
      </MText>
      <TextInput
        testID="producto-nuevo-precio"
        aria-label="¿En cuánto lo vendes?"
        inputMode="decimal"
        placeholder="0.00"
        placeholderTextColor={colors.textMuted}
        value={f.precio}
        onChangeText={f.setPrecio}
        style={{ ...CAMPO, flex: 1 }}
      />
    </View>
  );
}

export function Tipos(p: { f: ProductoNuevoForm; tipos: readonly string[] }): ReactElement {
  return (
    <View
      role="radiogroup"
      aria-label="Tipo de producto"
      flexDirection="row"
      flexWrap="wrap"
      gap={8}
    >
      {p.tipos.map((t) => (
        <Chip
          key={t}
          label={t}
          selected={p.f.tipo === t}
          onPress={() => p.f.setTipo(t as typeof p.f.tipo)}
          testID={`producto-nuevo-tipo-${t}`}
        />
      ))}
    </View>
  );
}
