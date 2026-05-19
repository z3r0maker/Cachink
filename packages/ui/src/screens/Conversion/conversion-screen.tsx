/**
 * ConversionScreen — main screen with sub-tabs: "Recetas" / "Historial".
 * Phase 18.
 */

import { useMemo, useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { ConversionReceta, Product } from '@cachink/domain';
import { Btn, EmptyState, SegmentedToggle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import {
  useConversionRecetas,
  useConversiones,
  useProductos,
  useProductosConStock,
  useCrearConversionReceta,
  useEliminarConversionReceta,
  useEjecutarConversion,
  useStockMap,
} from '../../hooks/index';
import { RecetaList } from './receta-list';
import { ConversionHistorial } from './conversion-historial';
import { ConversionOverlays } from './conversion-overlays';

export type ConversionSubTab = 'recetas' | 'historial';

export interface ConversionScreenProps {
  readonly testID?: string;
}

function useProductMap(productos: readonly Product[]): ReadonlyMap<string, Product> {
  return useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of productos) map.set(p.id as string, p);
    return map;
  }, [productos]);
}

function filterMPs(productos: readonly Product[]): readonly Product[] {
  return productos.filter((p) => p.usoProducto === 'materia-prima' || p.usoProducto === 'ambos');
}

function filterVenta(productos: readonly Product[]): readonly Product[] {
  return productos.filter((p) => p.usoProducto === 'venta' || p.usoProducto === 'ambos');
}

function useConversionData() {
  const recetasQ = useConversionRecetas();
  const conversionesQ = useConversiones();
  const productosQ = useProductos();
  const stockQ = useProductosConStock();
  const crearReceta = useCrearConversionReceta();
  const eliminarReceta = useEliminarConversionReceta();
  const ejecutar = useEjecutarConversion();
  const productos = productosQ.data ?? [];
  const productMap = useProductMap(productos);
  const stockMap = useStockMap(stockQ);
  const mps = useMemo(() => filterMPs(productos), [productos]);
  const ventas = useMemo(() => filterVenta(productos), [productos]);
  return {
    recetasQ,
    conversionesQ,
    crearReceta,
    eliminarReceta,
    ejecutar,
    productMap,
    stockMap,
    mps,
    ventas,
  };
}

function RecetasTab({
  data,
  onOpenModal,
  onConvertir,
}: {
  data: ReturnType<typeof useConversionData>;
  onOpenModal: () => void;
  onConvertir: (r: ConversionReceta) => void;
}): ReactElement {
  const { t } = useTranslation();
  const canCreate = data.mps.length > 0 && data.ventas.length > 0;
  const actionContent = canCreate ? (
    <Btn variant="primary" onPress={onOpenModal} fullWidth testID="conversion-nueva-receta-btn">
      {t('conversion.nuevaReceta')}
    </Btn>
  ) : (
    <EmptyState
      icon="package"
      title={t('conversion.noProductsTitle')}
      description={t('conversion.noProductsHint')}
      testID="conversion-no-products"
    />
  );
  return (
    <>
      <View paddingHorizontal={16} paddingVertical={8}>
        {actionContent}
      </View>
      <RecetaList
        recetas={data.recetasQ.data ?? []}
        products={data.productMap}
        onConvertir={onConvertir}
        onEliminar={(r) => data.eliminarReceta.mutate(r.id)}
      />
    </>
  );
}

function TabContent({
  tab,
  data,
  onOpenModal,
  onConvertir,
}: {
  tab: ConversionSubTab;
  data: ReturnType<typeof useConversionData>;
  onOpenModal: () => void;
  onConvertir: (r: ConversionReceta) => void;
}): ReactElement {
  if (tab === 'recetas')
    return <RecetasTab data={data} onOpenModal={onOpenModal} onConvertir={onConvertir} />;
  return (
    <ConversionHistorial conversiones={data.conversionesQ.data ?? []} products={data.productMap} />
  );
}

function ConversionTabBar({
  tab,
  setTab,
}: {
  tab: ConversionSubTab;
  setTab: (v: ConversionSubTab) => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <View paddingHorizontal={16} paddingTop={8} paddingBottom={4}>
      <SegmentedToggle
        options={[
          { key: 'recetas', label: t('conversion.tabRecetas') },
          { key: 'historial', label: t('conversion.tabHistorial') },
        ]}
        value={tab}
        onChange={(k) => setTab(k as ConversionSubTab)}
        testID="conversion-tab-toggle"
      />
    </View>
  );
}

export function ConversionScreen(props: ConversionScreenProps): ReactElement {
  const [tab, setTab] = useState<ConversionSubTab>('recetas');
  const [recetaModalOpen, setRecetaModalOpen] = useState(false);
  const [convertir, setConvertir] = useState<ConversionReceta | null>(null);
  const data = useConversionData();

  return (
    <View flex={1} testID={props.testID ?? 'conversion-screen'}>
      <ConversionTabBar tab={tab} setTab={setTab} />
      <TabContent
        tab={tab}
        data={data}
        onOpenModal={() => setRecetaModalOpen(true)}
        onConvertir={setConvertir}
      />
      <ConversionOverlays
        mps={data.mps}
        ventas={data.ventas}
        productMap={data.productMap}
        stockMap={data.stockMap}
        crearReceta={data.crearReceta}
        ejecutar={data.ejecutar}
        recetaModalOpen={recetaModalOpen}
        setRecetaModalOpen={setRecetaModalOpen}
        convertir={convertir}
        setConvertir={setConvertir}
      />
    </View>
  );
}
