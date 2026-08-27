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
import { useMemo, useRef, type ReactElement } from 'react';
import { ScrollView, type TextInput } from 'react-native';
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
import { NuevaVentaCta } from './nueva-venta-cta';

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

function useFilteredProducts(productos: readonly Product[], search: string): readonly Product[] {
  return useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return productos;
    return productos.filter(
      (p) => p.nombre.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)),
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

interface ProductPaneConfig {
  readonly filtered: readonly Product[];
  readonly stockMap?: ReadonlyMap<string, number>;
  readonly cartQuantities: ReadonlyMap<string, number>;
  readonly onPress: (p: Product) => void;
  readonly productSearch: string;
  readonly onProductSearchChange: (q: string) => void;
  readonly hasProductos: boolean;
  readonly onGoToProductos?: () => void;
  /** Focus target handed to the "Nueva venta" CTA (review item #8). */
  readonly searchRef?: React.RefObject<unknown>;
}

function TabletLayout(props: {
  testID: string;
  title: string;
  paneProps: ProductPaneConfig;
  totalBar: ReactElement;
  cta: ReactElement;
  screenProps: VentasScreenProps;
}): ReactElement {
  return (
    <View testID={props.testID} flex={1} backgroundColor={colors.offwhite}>
      <View flex={1} padding={16}>
        <SectionTitle title={props.title} />
        <SplitPane
          left={
            <View flex={1} gap={12}>
              {props.cta}
              <ProductPane {...props.paneProps} />
            </View>
          }
          right={
            <View flex={1} gap={12}>
              {props.totalBar}
              <CartFooter
                itemCount={props.screenProps.cart.itemCount}
                totalCentavos={props.screenProps.cart.totalCentavos}
                onCheckout={props.screenProps.onCheckout}
              />
              <ScrollView style={{ flex: 1 }}>
                <CartSection {...props.screenProps} />
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

function useVentasSetup(props: VentasScreenProps) {
  const { t } = useTranslation();
  const filtered = useFilteredProducts(props.productos, props.productSearch);
  useProductColorMap(props.productos);
  const searchRef = useRef<TextInput>(null);

  const paneProps: ProductPaneConfig = {
    filtered,
    stockMap: props.stockMap,
    cartQuantities: props.cartQuantities,
    onPress: props.onAddToCart,
    productSearch: props.productSearch,
    onProductSearchChange: props.onProductSearchChange,
    hasProductos: props.productos.length > 0,
    onGoToProductos: props.onGoToProductos,
    searchRef,
  };

  const cta = (
    <NuevaVentaCta
      label={t('ventas.nuevaVenta')}
      hint={t('ventas.hintTocaProducto')}
      onPress={() => searchRef.current?.focus()}
    />
  );

  const totalBar = (
    <TotalBar
      total={props.total}
      ventaCount={props.ventaCount}
      showCorte={props.showCorte}
      onCorteOpen={props.onCorteOpen}
    />
  );

  return { t, paneProps, totalBar, cta, testID: props.testID ?? 'ventas-screen' };
}

function PhoneLayout(props: {
  testID: string;
  title: string;
  paneProps: ProductPaneConfig;
  totalBar: ReactElement;
  cta: ReactElement;
  screenProps: VentasScreenProps;
}): ReactElement {
  return (
    <View testID={props.testID} flex={1} backgroundColor={colors.offwhite}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}
      >
        <SectionTitle title={props.title} />
        {props.totalBar}
        {props.cta}
        <ProductPane {...props.paneProps} />
        <CartSection {...props.screenProps} />
      </ScrollView>
      <CartFooter
        itemCount={props.screenProps.cart.itemCount}
        totalCentavos={props.screenProps.cart.totalCentavos}
        onCheckout={props.screenProps.onCheckout}
      />
    </View>
  );
}

export function VentasScreen(props: VentasScreenProps): ReactElement {
  const media = useMedia();
  const { t, paneProps, totalBar, cta, testID } = useVentasSetup(props);

  const layoutProps = {
    testID,
    // Review item #8: the tab used to be titled "Ventas", which read
    // as a list of past sales. It is a POS screen — name it for what
    // the user is here to do.
    title: t('ventas.nuevaVenta'),
    paneProps,
    totalBar,
    cta,
    screenProps: props,
  };

  if (Boolean(media.gtMd)) {
    return <TabletLayout {...layoutProps} />;
  }

  return <PhoneLayout {...layoutProps} />;
}
