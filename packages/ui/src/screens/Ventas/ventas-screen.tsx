/**
 * VentasScreen — inline POS surface (ADR-048).
 *
 * The screen IS the product picker. Product cards live directly on the
 * surface; tapping a card fires `onProductoTap` which the route uses to
 * open a small `<VentaConfirmSheet>`. No more free-text modal.
 *
 * Layout:
 *   - Tablet landscape (`gtMd`): SplitPane — products left, today's sales right.
 *   - Tablet portrait / phone: stacked — products top, sales below.
 *
 * Pure presentation. Data + loading / error states + handlers are all
 * props so every screen state is testable without async harness.
 */

import { useMemo, type ReactElement } from 'react';
import { Text, View, useMedia } from '@tamagui/core';
import type { Product, Sale } from '@cachink/domain';
import type { Money } from '@cachink/domain';
import { formatDate } from '@cachink/domain';
import type { IsoDate } from '@cachink/domain';
import {
  ProductoCardGrid,
  SearchBar,
  SectionTitle,
  SplitPane,
} from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { VentasEmptyProductos } from './empty-productos';
import { SalesContent, TotalCard } from './ventas-sales-pane';

export interface VentasScreenProps {
  // --- Date + sales ---
  readonly fecha: string;
  /** @deprecated Date is now read-only (device date). Kept for backwards compat. */
  readonly onChangeFecha?: (fecha: string) => void;
  readonly ventas: readonly Sale[];
  readonly total: Money;
  readonly onVentaPress?: (venta: Sale) => void;
  readonly loading?: boolean;
  readonly error?: Error | null;
  readonly onRetry?: () => void;
  readonly testID?: string;
  readonly onEditVenta?: (venta: Sale) => void;
  readonly onEliminarVenta?: (venta: Sale) => void;

  // --- Inline product grid (ADR-048) ---
  readonly productos: readonly Product[];
  readonly stockMap?: ReadonlyMap<string, number>;
  readonly onProductoTap: (p: Product) => void;
  readonly productSearch: string;
  readonly onProductSearchChange: (q: string) => void;

  // --- Empty-state navigation ---
  readonly onGoToProductos?: () => void;
}

function useFilteredProducts(productos: readonly Product[], search: string): readonly Product[] {
  return useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return productos;
    return productos.filter((p) => p.nombre.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
  }, [productos, search]);
}

function ProductPane(props: VentasScreenProps & { filtered: readonly Product[] }): ReactElement {
  const { t } = useTranslation();
  return (
    <View flex={1} gap={12}>
      <SearchBar value={props.productSearch} onChange={props.onProductSearchChange} placeholder={t('ventas.searchProducto')} testID="ventas-product-search" />
      {props.productos.length === 0 ? (
        <VentasEmptyProductos onGoToProductos={props.onGoToProductos} />
      ) : (
        <ProductoCardGrid productos={props.filtered} stockMap={props.stockMap} mode="sell" onPress={props.onProductoTap} testID="ventas-product-grid" />
      )}
    </View>
  );
}

function ReadOnlyDate({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={8} testID="ventas-fecha">
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={12}
        color={colors.gray600}
        style={{ textTransform: 'uppercase' }}
      >
        {label}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={16}
        color={colors.black}
      >
        {formatDate(value as IsoDate)}
      </Text>
    </View>
  );
}

function SalesPane(props: VentasScreenProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View flex={1} gap={12}>
      <TotalCard label={t('ventas.totalDelDia')} total={props.total} />
      <ReadOnlyDate label={t('ventas.fechaLabel')} value={props.fecha} />
      <SalesContent ventas={props.ventas} loading={props.loading} error={props.error} onRetry={props.onRetry} onVentaPress={props.onVentaPress} onEditVenta={props.onEditVenta} onEliminarVenta={props.onEliminarVenta} />
    </View>
  );
}

export function VentasScreen(props: VentasScreenProps): ReactElement {
  const { t } = useTranslation();
  const media = useMedia();
  const filtered = useFilteredProducts(props.productos, props.productSearch);

  if (Boolean(media.gtMd)) {
    return (
      <View testID={props.testID ?? 'ventas-screen'} flex={1} padding={16} backgroundColor={colors.offwhite}>
        <SectionTitle title={t('ventas.title')} />
        <SplitPane left={<ProductPane {...props} filtered={filtered} />} right={<SalesPane {...props} />} leftFlex={0.45} rightFlex={0.55} testID="ventas-split" />
      </View>
    );
  }
  return (
    <View testID={props.testID ?? 'ventas-screen'} flex={1} padding={16} gap={12} backgroundColor={colors.offwhite}>
      <SectionTitle title={t('ventas.title')} />
      <ProductPane {...props} filtered={filtered} />
      <SectionTitle title={t('ventas.ventasDeHoy')} />
      <SalesPane {...props} />
    </View>
  );
}
