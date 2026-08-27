/**
 * ProductPane — search + product grid sub-pane used inside VentasScreen.
 *
 * Extracted from ventas-screen.tsx to keep the main file under 200 lines.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { Product } from '@cachink/domain';
import { ProductoCardGrid, SearchBar } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { VentasEmptyProductos } from './empty-productos';

export interface ProductPaneProps {
  readonly filtered: readonly Product[];
  readonly stockMap?: ReadonlyMap<string, number>;
  readonly cartQuantities: ReadonlyMap<string, number>;
  readonly onPress: (p: Product) => void;
  readonly productSearch: string;
  readonly onProductSearchChange: (q: string) => void;
  readonly hasProductos: boolean;
  readonly onGoToProductos?: () => void;
  /**
   * Focus target for the "Nueva venta" CTA (review item #8). The CTA
   * lives above this pane, so the screen owns the ref and hands it
   * down rather than reaching into the pane's internals.
   */
  readonly searchRef?: React.RefObject<unknown>;
}

export function ProductPane(props: ProductPaneProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View flex={1} gap={12}>
      <SearchBar
        value={props.productSearch}
        onChange={props.onProductSearchChange}
        placeholder={t('ventas.searchProducto')}
        testID="ventas-product-search"
        inputRef={props.searchRef}
      />
      {!props.hasProductos ? (
        <VentasEmptyProductos onGoToProductos={props.onGoToProductos} />
      ) : (
        <ProductoCardGrid
          productos={props.filtered}
          stockMap={props.stockMap}
          cartQuantities={props.cartQuantities}
          badgeVariant="yellow"
          mode="sell"
          onPress={props.onPress}
          testID="ventas-product-grid"
        />
      )}
    </View>
  );
}
