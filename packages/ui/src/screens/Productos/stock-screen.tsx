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
import {
  Btn,
  FAB,
  Icon,
  List,
  SearchBar,
  SectionTitle,
  SwipeableRow,
} from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import { ProductoListRow } from './producto-list-row';
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
  /** Audit 4.6 — opt-in mobile FAB for the primary action. */
  readonly showFab?: boolean;
  /** Audit Round 2 K3 — swipe-to-edit handler. */
  readonly onEditProducto?: (item: ProductoConStock) => void;
  /** Audit Round 2 K3 — swipe-to-delete handler (route opens ConfirmDialog). */
  readonly onEliminarProducto?: (item: ProductoConStock) => void;
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

interface StockListProps {
  readonly items: readonly ProductoConStock[];
  readonly onProductoPress?: (item: ProductoConStock) => void;
  readonly onEditProducto?: (item: ProductoConStock) => void;
  readonly onEliminarProducto?: (item: ProductoConStock) => void;
}

function ProductoRow({
  row,
  onProductoPress,
  onEditProducto,
  onEliminarProducto,
}: { row: ProductoConStock } & StockListProps): ReactElement {
  const card = (
    <ProductoListRow
      producto={row.producto}
      stock={row.stock}
      onPress={() => onProductoPress?.(row)}
    />
  );
  const swipeEnabled = onEditProducto !== undefined || onEliminarProducto !== undefined;
  if (!swipeEnabled) return <View marginBottom={10}>{card}</View>;
  return (
    <View marginBottom={10}>
      <SwipeableRow
        onSwipeLeft={onEditProducto ? () => onEditProducto(row) : undefined}
        onSwipeRight={onEliminarProducto ? () => onEliminarProducto(row) : undefined}
        testID={`producto-swipe-${row.producto.id}`}
      >
        {card}
      </SwipeableRow>
    </View>
  );
}

function StockList(props: StockListProps): ReactElement {
  return (
    <List<ProductoConStock>
      data={props.items}
      keyExtractor={(row) => row.producto.id}
      renderItem={(row) => <ProductoRow row={row} {...props} />}
      testID="stock-list"
    />
  );
}

function StockBody(
  props: StockScreenProps & { filtered: readonly ProductoConStock[] },
): ReactElement {
  if (props.error) return <EmptyProductos onNuevoProducto={props.onNuevoProducto} />;
  if (props.loading === true) return <EmptyProductos onNuevoProducto={props.onNuevoProducto} />;
  if (props.filtered.length === 0) {
    return <EmptyProductos onNuevoProducto={props.onNuevoProducto} />;
  }
  return (
    <StockList
      items={props.filtered}
      onProductoPress={props.onProductoPress}
      onEditProducto={props.onEditProducto}
      onEliminarProducto={props.onEliminarProducto}
    />
  );
}

export function StockScreen(props: StockScreenProps): ReactElement {
  const { t } = useTranslation();
  const filtered = filterProductos(props.items, props.query);
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
      <SearchBar
        label={t('inventario.buscar')}
        placeholder={t('inventario.buscarPlaceholder')}
        value={props.query}
        onChange={props.onChangeQuery}
        testID="stock-buscar"
      />
      <StockBody {...props} filtered={filtered} />
      {props.showFab === true && (
        <FAB
          icon={<Icon name="plus" size={28} color={colors.black} />}
          ariaLabel={t('inventario.newCta')}
          onPress={props.onNuevoProducto}
          testID="stock-fab"
        />
      )}
    </View>
  );
}
