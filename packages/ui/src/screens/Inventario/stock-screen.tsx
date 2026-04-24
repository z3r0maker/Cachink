/**
 * StockScreen — Inventario tab for the Stock list (Slice 2 C11,
 * M5-T01).
 *
 * Buscar input filters by nombre or SKU. Pure UI — accepts the
 * hydrated ProductoConStock list as props, surfaces loading / error /
 * empty states in the standard Cachink shapes.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { ProductoConStock } from '../../hooks/use-productos-con-stock';
import { Btn, Input, SectionTitle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import { ProductoCard } from './producto-card';
import { EmptyProductos } from './empty-productos';

export interface StockScreenProps {
  readonly query: string;
  readonly onChangeQuery: (next: string) => void;
  readonly items: readonly ProductoConStock[];
  readonly onNuevoProducto: () => void;
  readonly onProductoPress?: (item: ProductoConStock) => void;
  readonly loading?: boolean;
  readonly error?: Error | null;
  readonly testID?: string;
}

export function filterProductos(
  items: readonly ProductoConStock[],
  query: string,
): readonly ProductoConStock[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((row) => {
    const nombre = row.producto.nombre.toLowerCase();
    const sku = row.producto.sku?.toLowerCase() ?? '';
    return nombre.includes(q) || sku.includes(q);
  });
}

function StockList({
  items,
  onProductoPress,
}: {
  items: readonly ProductoConStock[];
  onProductoPress?: (item: ProductoConStock) => void;
}): ReactElement {
  return (
    <View gap={10}>
      {items.map((row) => (
        <ProductoCard
          key={row.producto.id}
          producto={row.producto}
          stock={row.stock}
          onPress={() => onProductoPress?.(row)}
        />
      ))}
    </View>
  );
}

export function StockScreen(props: StockScreenProps): ReactElement {
  const { t } = useTranslation();
  const filtered = filterProductos(props.items, props.query);

  const body = ((): ReactElement => {
    if (props.error) return <EmptyProductos onNuevoProducto={props.onNuevoProducto} />;
    if (props.loading === true) return <EmptyProductos onNuevoProducto={props.onNuevoProducto} />;
    if (filtered.length === 0) return <EmptyProductos onNuevoProducto={props.onNuevoProducto} />;
    return <StockList items={filtered} onProductoPress={props.onProductoPress} />;
  })();

  return (
    <View
      testID={props.testID ?? 'stock-screen'}
      flex={1}
      padding={16}
      gap={12}
      backgroundColor={colors.offwhite}
    >
      <SectionTitle
        title={t('inventario.title')}
        action={
          <Btn variant="primary" onPress={props.onNuevoProducto} testID="stock-nuevo-producto">
            {t('inventario.newCta')}
          </Btn>
        }
      />
      <Input
        label={t('inventario.buscar')}
        placeholder={t('inventario.buscarPlaceholder')}
        value={props.query}
        onChange={props.onChangeQuery}
        testID="stock-buscar"
      />
      {body}
    </View>
  );
}
