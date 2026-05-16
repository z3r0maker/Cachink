/**
 * VentasScreen — tap-to-cart POS surface.
 *
 * Tapping a product adds it to the cart (no modal). The operator settles
 * the batch via the sticky "Cobrar" footer.
 *
 * Layout:
 *   - Tablet landscape (`gtMd`): SplitPane — products left,
 *     total bar + cart + footer right.
 *   - Phone / portrait: stacked with sticky footer at the bottom.
 *
 * Pure presentation — data, loading/error, and handlers are props.
 */
import { useMemo, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View, useMedia } from '@tamagui/core';
import type { Product } from '@cachink/domain';
import type { Money, ProductId } from '@cachink/domain';
import { SectionTitle, SplitPane } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import { PRODUCT_BG_COLORS } from '../../product-colors';
import type { CartState } from '../../hooks/use-cart';
import { ProductPane } from './ventas-product-pane';
import { TotalBar } from './total-bar';
import { CartStrip } from './cart-strip';
import { CartFooter } from './cart-footer';
import { EmptyCartHint } from './empty-cart-hint';

export interface VentasScreenProps {
  // --- Products ---
  readonly productos: readonly Product[];
  readonly stockMap?: ReadonlyMap<string, number>;
  readonly productSearch: string;
  readonly onProductSearchChange: (q: string) => void;
  readonly onGoToProductos?: () => void;
  // --- Cart ---
  readonly cart: CartState;
  readonly onAddToCart: (p: Product) => void;
  readonly onRemoveOne: (productoId: ProductId) => void;
  readonly onRemoveAll: (productoId: ProductId) => void;
  readonly onClearCart: () => void;
  readonly cartQuantities: ReadonlyMap<string, number>;
  // --- Checkout ---
  readonly onCheckout: () => void;
  // --- TotalBar ---
  readonly total: Money;
  readonly ventaCount: number;
  readonly showCorte?: boolean;
  readonly onCorteOpen?: () => void;
  readonly testID?: string;
}

function useFilteredProducts(
  productos: readonly Product[],
  search: string,
): readonly Product[] {
  return useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return productos;
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)),
    );
  }, [productos, search]);
}

function useProductColorMap(p: readonly Product[]): ReadonlyMap<string, string> {
  return useMemo(() => {
    const m = new Map<string, string>();
    for (const x of p) {
      const hex = PRODUCT_BG_COLORS[x.colorFondo ?? 'white'];
      if (hex !== PRODUCT_BG_COLORS.white) m.set(x.id, hex);
    }
    return m;
  }, [p]);
}

function CartSection(props: VentasScreenProps): ReactElement {
  if (props.cart.items.length === 0) return <EmptyCartHint />;
  return (
    <CartStrip
      items={props.cart.items}
      onRemoveOne={props.onRemoveOne}
      onRemoveAll={props.onRemoveAll}
      onClear={props.onClearCart}
      variant="yellow"
    />
  );
}

export function VentasScreen(props: VentasScreenProps): ReactElement {
  const { t } = useTranslation();
  const media = useMedia();
  const filtered = useFilteredProducts(props.productos, props.productSearch);
  useProductColorMap(props.productos);

  const productPaneProps = {
    filtered,
    stockMap: props.stockMap,
    cartQuantities: props.cartQuantities,
    onPress: props.onAddToCart,
    productSearch: props.productSearch,
    onProductSearchChange: props.onProductSearchChange,
    hasProductos: props.productos.length > 0,
    onGoToProductos: props.onGoToProductos,
  };

  const totalBar = (
    <TotalBar
      total={props.total}
      ventaCount={props.ventaCount}
      showCorte={props.showCorte}
      onCorteOpen={props.onCorteOpen}
    />
  );

  if (Boolean(media.gtMd)) {
    return (
      <View testID={props.testID ?? 'ventas-screen'} flex={1} backgroundColor={colors.offwhite}>
        <View flex={1} padding={16}>
          <SectionTitle title={t('ventas.title')} />
          <SplitPane
            left={<ProductPane {...productPaneProps} />}
            right={
              <View flex={1} gap={12}>
                {totalBar}
                <CartFooter
                  itemCount={props.cart.itemCount}
                  totalCentavos={props.cart.totalCentavos}
                  onCheckout={props.onCheckout}
                />
                <ScrollView style={{ flex: 1 }}>
                  <CartSection {...props} />
                </ScrollView>
              </View>
            }
            leftFlex={0.45}
            rightFlex={0.55}
            testID="ventas-split"
          />
        </View>
      </View>
    );
  }

  return (
    <View testID={props.testID ?? 'ventas-screen'} flex={1} backgroundColor={colors.offwhite}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}
      >
        <SectionTitle title={t('ventas.title')} />
        {totalBar}
        <ProductPane {...productPaneProps} />
        <CartSection {...props} />
      </ScrollView>
      <CartFooter
        itemCount={props.cart.itemCount}
        totalCentavos={props.cart.totalCentavos}
        onCheckout={props.onCheckout}
      />
    </View>
  );
}
