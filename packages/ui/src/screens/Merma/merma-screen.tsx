/**
 * MermaScreen — tap-to-cart shrinkage tracking with redSoft accent.
 *
 * Same cart model as Ventas but red-tinted: tapping a product adds it
 * to the merma cart; the batch is settled via MermaCheckoutSheet.
 *
 * Layout mirrors Ventas (Fix 5):
 *   - Tablet landscape (`gtMd`): SplitPane — products left, cart right.
 *   - Phone / portrait: stacked with sticky footer.
 */
import { useMemo, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View, useMedia } from '@tamagui/core';
import type { Product, ProductId } from '@cachink/domain';
import {
  EmptyState,
  SafeAreaSpacer,
  SectionTitle,
  SearchBar,
  SplitPane,
  ProductoCardGrid,
} from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import type { CartState } from '../../hooks/use-cart';
import { CartStrip } from '../Ventas/cart-strip';
import { CartFooter } from '../Ventas/cart-footer';
import { EmptyCartHint } from '../Ventas/empty-cart-hint';

export interface MermaScreenProps {
  readonly productos: readonly Product[];
  readonly cart: CartState;
  readonly onAddToCart: (p: Product) => void;
  readonly onRemoveOne: (productoId: ProductId) => void;
  readonly onRemoveAll: (productoId: ProductId) => void;
  readonly onClearCart: () => void;
  readonly cartQuantities: ReadonlyMap<string, number>;
  readonly onCheckout: () => void;
  readonly submitting: boolean;
  readonly productSearch: string;
  readonly onProductSearchChange: (q: string) => void;
  readonly stockMap?: ReadonlyMap<string, number>;
  readonly testID?: string;
}

function useFilteredProducts(productos: readonly Product[], search: string): readonly Product[] {
  return useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return productos;
    return productos.filter(
      (p) => p.nombre.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)),
    );
  }, [productos, search]);
}

function CartSection(props: MermaScreenProps): ReactElement {
  if (props.cart.items.length === 0) {
    return <EmptyCartHint hint="Toca un producto para registrar su merma" />;
  }
  return (
    <CartStrip
      items={props.cart.items}
      onRemoveOne={props.onRemoveOne}
      onRemoveAll={props.onRemoveAll}
      onClear={props.onClearCart}
      variant="red"
    />
  );
}

function ProductGrid(props: {
  readonly productos: readonly Product[];
  readonly filtered: readonly Product[];
  readonly cartQuantities: ReadonlyMap<string, number>;
  readonly stockMap?: ReadonlyMap<string, number>;
  readonly onPress: (p: Product) => void;
  readonly productSearch: string;
  readonly onProductSearchChange: (q: string) => void;
}): ReactElement {
  const { t } = useTranslation();

  if (props.productos.length === 0) {
    return (
      <EmptyState
        icon="trending-down"
        title={t('merma.emptyTitle')}
        description={t('merma.emptyHint')}
        testID="merma-empty"
      />
    );
  }

  return (
    <View gap={12}>
      <SearchBar
        value={props.productSearch}
        onChange={props.onProductSearchChange}
        placeholder="Buscar producto..."
        testID="merma-product-search"
      />
      <ProductoCardGrid
        productos={props.filtered}
        cartQuantities={props.cartQuantities}
        stockMap={props.stockMap}
        badgeVariant="red"
        mode="sell"
        onPress={props.onPress}
        testID="merma-grid"
      />
    </View>
  );
}

function MermaCartFooter(props: {
  cart: CartState;
  onCheckout: () => void;
  submitting: boolean;
}): ReactElement {
  return (
    <CartFooter
      itemCount={props.cart.itemCount}
      totalCentavos={props.cart.totalCentavos}
      onCheckout={props.onCheckout}
      variant="red"
      checkoutLabel="Registrar merma"
      disabled={props.submitting}
    />
  );
}

function buildGridProps(props: MermaScreenProps, filtered: readonly Product[]) {
  return {
    productos: props.productos,
    filtered,
    cartQuantities: props.cartQuantities,
    stockMap: props.stockMap,
    onPress: props.onAddToCart,
    productSearch: props.productSearch,
    onProductSearchChange: props.onProductSearchChange,
  };
}

function TabletLayout(props: {
  testID: string;
  title: string;
  gridProps: Parameters<typeof ProductGrid>[0];
  screenProps: MermaScreenProps;
}): ReactElement {
  return (
    <View testID={props.testID} flex={1} backgroundColor={colors.offwhite}>
      <View flex={1} padding={16}>
        <SectionTitle title={props.title} />
        <SplitPane
          left={<ProductGrid {...props.gridProps} />}
          right={
            <View flex={1} gap={12}>
              <MermaCartFooter
                cart={props.screenProps.cart}
                onCheckout={props.screenProps.onCheckout}
                submitting={props.screenProps.submitting}
              />
              <ScrollView style={{ flex: 1 }}>
                <CartSection {...props.screenProps} />
              </ScrollView>
            </View>
          }
          leftFlex={0.45}
          rightFlex={0.55}
          testID="merma-split"
        />
      </View>
    </View>
  );
}

function PhoneLayout(props: {
  testID: string;
  title: string;
  gridProps: Parameters<typeof ProductGrid>[0];
  screenProps: MermaScreenProps;
}): ReactElement {
  return (
    <View testID={props.testID} flex={1} backgroundColor={colors.offwhite}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          gap: 16,
          paddingBottom: 120,
        }}
      >
        <SafeAreaSpacer />
        <SectionTitle title={props.title} />
        <ProductGrid {...props.gridProps} />
        <CartSection {...props.screenProps} />
      </ScrollView>
      <MermaCartFooter
        cart={props.screenProps.cart}
        onCheckout={props.screenProps.onCheckout}
        submitting={props.screenProps.submitting}
      />
    </View>
  );
}

export function MermaScreen(props: MermaScreenProps): ReactElement {
  const { t } = useTranslation();
  const media = useMedia();
  const filtered = useFilteredProducts(props.productos, props.productSearch);
  const gridProps = buildGridProps(props, filtered);
  const testID = props.testID ?? 'merma-screen';
  const title = t('merma.title');

  if (Boolean(media.gtMd)) {
    return <TabletLayout testID={testID} title={title} gridProps={gridProps} screenProps={props} />;
  }
  return <PhoneLayout testID={testID} title={title} gridProps={gridProps} screenProps={props} />;
}
