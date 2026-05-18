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
import { NuevaRecetaModal } from './nueva-receta-modal';
import { ConvertirSheet } from './convertir-sheet';
import { ConversionHistorial } from './conversion-historial';

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
  return { recetasQ, conversionesQ, crearReceta, eliminarReceta, ejecutar, productMap, stockMap, mps, ventas };
}

function RecetasTab({ data, onOpenModal, onConvertir }: {
  data: ReturnType<typeof useConversionData>;
  onOpenModal: () => void;
  onConvertir: (r: ConversionReceta) => void;
}): ReactElement {
  const { t } = useTranslation();
  const canCreate = data.mps.length > 0 && data.ventas.length > 0;
  return (
    <>
      <View paddingHorizontal={16} paddingVertical={8}>
        {canCreate ? (
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
        )}
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

function ConversionOverlays({ data, recetaModalOpen, setRecetaModalOpen, convertir, setConvertir }: {
  data: ReturnType<typeof useConversionData>;
  recetaModalOpen: boolean; setRecetaModalOpen: (v: boolean) => void;
  convertir: ConversionReceta | null; setConvertir: (v: ConversionReceta | null) => void;
}): ReactElement {
  return (
    <>
      <NuevaRecetaModal
        open={recetaModalOpen}
        onClose={() => setRecetaModalOpen(false)}
        onSubmit={(input) => data.crearReceta.mutate(input, { onSuccess: () => setRecetaModalOpen(false) })}
        submitting={data.crearReceta.isPending}
        materiasPrimas={data.mps}
        productosVenta={data.ventas}
      />
      <ConvertirSheet
        open={convertir !== null} onClose={() => setConvertir(null)} receta={convertir}
        products={data.productMap} stockMap={data.stockMap}
        onConfirm={(mult) => {
          if (!convertir) return;
          data.ejecutar.mutate({ recetaId: convertir.id, multiplicador: mult }, { onSuccess: () => setConvertir(null) });
        }}
        submitting={data.ejecutar.isPending}
      />
    </>
  );
}

export function ConversionScreen(props: ConversionScreenProps): ReactElement {
  const { t } = useTranslation();
  const [tab, setTab] = useState<ConversionSubTab>('recetas');
  const [recetaModalOpen, setRecetaModalOpen] = useState(false);
  const [convertir, setConvertir] = useState<ConversionReceta | null>(null);
  const data = useConversionData();

  return (
    <View flex={1} testID={props.testID ?? 'conversion-screen'}>
      <View paddingHorizontal={16} paddingTop={8} paddingBottom={4}>
        <SegmentedToggle
          options={[{ key: 'recetas', label: t('conversion.tabRecetas') }, { key: 'historial', label: t('conversion.tabHistorial') }]}
          value={tab} onChange={(k) => setTab(k as ConversionSubTab)} testID="conversion-tab-toggle" />
      </View>
      {tab === 'recetas' && <RecetasTab data={data} onOpenModal={() => setRecetaModalOpen(true)} onConvertir={setConvertir} />}
      {tab === 'historial' && <ConversionHistorial conversiones={data.conversionesQ.data ?? []} products={data.productMap} />}
      <ConversionOverlays data={data} recetaModalOpen={recetaModalOpen} setRecetaModalOpen={setRecetaModalOpen} convertir={convertir} setConvertir={setConvertir} />
    </View>
  );
}
