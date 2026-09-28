/**
 * The catalogue half of Cobrar (MvCobrar; TbCobrar's left side): the title,
 * the search with the scanner button, the category chips and the tiles, two
 * across on a phone and more on a tablet. Empty and no-match states say what
 * to do next.
 */
import type { ReactElement } from 'react';
import { FlatList, Pressable, ScrollView, TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { Btn } from '../../components/Btn/index';
import { Chip } from '../../components/Chip/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, colors, portalFontSizes, radii, typography } from '../../theme';
import type { ProductoCobrar } from './cobrar-catalogo';
import { COBRAR_GLYPHS } from './cobrar-glyphs';
import { CobrarTile } from './cobrar-tile';

export interface CatalogoViewProps {
  readonly productos: readonly ProductoCobrar[];
  readonly categorias: readonly string[];
  readonly categoria: string;
  readonly onCategoria: (c: string) => void;
  readonly query: string;
  readonly onQuery: (q: string) => void;
  readonly cantidades: ReadonlyMap<string, number>;
  readonly onAdd: (p: ProductoCobrar) => void;
  readonly onEscanear: () => void;
  readonly onProductoNuevo: () => void;
  /** Two on a phone; the tablet boards fit four or five. */
  readonly columnas: number;
  /** Whether the business has any product at all (else the empty state). */
  readonly hayCatalogo: boolean;
}

const CAMPO = {
  flex: 1,
  height: 48,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  paddingHorizontal: 14,
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  backgroundColor: colors.white,
} as const;

const ESCANEAR = {
  ...CAMPO,
  flex: undefined,
  flexGrow: 0,
  flexShrink: 0,
  width: 48,
  justifyContent: 'center',
  paddingHorizontal: 0,
} as const;

function Busqueda(p: CatalogoViewProps): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={8}>
      <View style={CAMPO}>
        <PathIcon d={COBRAR_GLYPHS.buscar} size={18} color={colors.gray600} />
        <TextInput
          testID="cobrar-search"
          aria-label="Buscar producto"
          placeholder="Busca un producto o su precio"
          placeholderTextColor={colors.textMuted}
          value={p.query}
          onChangeText={p.onQuery}
          returnKeyType="search"
          style={{
            flex: 1,
            minWidth: 0,
            height: 44,
            fontFamily: typography.fontFamily,
            fontWeight: '600',
            fontSize: portalFontSizes.body,
            color: colors.black,
          }}
        />
      </View>
      <Pressable
        testID="cobrar-scan"
        role="button"
        aria-label="Escanear código de barras"
        onPress={p.onEscanear}
        style={ESCANEAR}
      >
        <PathIcon d={COBRAR_GLYPHS.escanear} size={22} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

function Categorias(p: CatalogoViewProps): ReactElement | null {
  if (p.categorias.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      role="radiogroup"
      aria-label="Categorías"
      contentContainerStyle={{
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 4,
        alignItems: 'center',
      }}
      style={{ flexGrow: 0, flexShrink: 0 }}
    >
      {p.categorias.map((c) => (
        <Chip
          key={c}
          label={c}
          selected={p.categoria === c}
          onPress={() => p.onCategoria(c)}
          testID={`cobrar-cat-${c}`}
        />
      ))}
    </ScrollView>
  );
}

function Vacio(p: CatalogoViewProps): ReactElement {
  const titulo = p.hayCatalogo ? 'No hay productos con eso' : 'Todavía no hay productos';
  const texto = p.hayCatalogo
    ? 'Revisa cómo lo escribiste o dalo de alta aquí mismo.'
    : 'Da de alta lo que vendes y ya puedes cobrar.';
  return (
    <View testID="cobrar-vacio" padding={24} gap={12} alignItems="center">
      <MText size="lg" weight="extraBold" textAlign="center">
        {titulo}
      </MText>
      <MText weight="semibold" color={colors.gray600} textAlign="center">
        {texto}
      </MText>
      <Btn variant="secondary" size="lg" onPress={p.onProductoNuevo} testID="cobrar-vacio-nuevo">
        Producto nuevo
      </Btn>
    </View>
  );
}

type Celda = ProductoCobrar | { readonly id: string; readonly hueco: true };

/** Empty cells fill the last row, so a lone tile keeps its column's width. */
function celdas(productos: readonly ProductoCobrar[], columnas: number): Celda[] {
  const resto = productos.length % columnas;
  const huecos = resto === 0 ? 0 : columnas - resto;
  return [
    ...productos,
    ...Array.from({ length: huecos }, (_, i) => ({ id: `hueco-${i}`, hueco: true as const })),
  ];
}

function Grid(p: CatalogoViewProps): ReactElement {
  return (
    <FlatList<Celda>
      testID="ventas-product-grid"
      key={`cols-${p.columnas}`}
      data={p.productos.length === 0 ? [] : celdas(p.productos, p.columnas)}
      keyExtractor={(x) => x.id}
      numColumns={p.columnas}
      columnWrapperStyle={p.columnas > 1 ? { gap: 12 } : undefined}
      contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14 }}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={<Vacio {...p} />}
      renderItem={({ item }) => (
        <View flex={1} flexBasis={0} minWidth={0}>
          {'hueco' in item ? null : (
            <CobrarTile p={item} qty={p.cantidades.get(item.id) ?? 0} onAdd={() => p.onAdd(item)} />
          )}
        </View>
      )}
    />
  );
}

export function CatalogoView(p: CatalogoViewProps): ReactElement {
  return (
    <View flex={1} minHeight={0}>
      <View paddingHorizontal={16} paddingTop={14} paddingBottom={6} gap={10}>
        <View flexDirection="row" alignItems="baseline" gap={10} flexWrap="wrap">
          <MText size="xl4" weight="extraBold" letterSpacing={-0.9} role="heading">
            Cobrar
          </MText>
          <MText size="md" weight="semibold" color={colors.gray600}>
            Toca lo que pidió el cliente
          </MText>
        </View>
        <Busqueda {...p} />
      </View>
      <Categorias {...p} />
      <Grid {...p} />
    </View>
  );
}
