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

export function ConversionScreen(props: ConversionScreenProps): ReactElement {
  const { t } = useTranslation();
  const [tab, setTab] = useState<ConversionSubTab>('recetas');
  const [recetaModalOpen, setRecetaModalOpen] = useState(false);
  const [convertir, setConvertir] = useState<ConversionReceta | null>(null);

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
  const canCreateReceta = mps.length > 0 && ventas.length > 0;

  const tabOptions = [
    { key: 'recetas', label: t('conversion.tabRecetas') },
    { key: 'historial', label: t('conversion.tabHistorial') },
  ];

  return (
    <View flex={1} testID={props.testID ?? 'conversion-screen'}>
      <View paddingHorizontal={16} paddingTop={8} paddingBottom={4}>
        <SegmentedToggle
          options={tabOptions}
          value={tab}
          onChange={(k) => setTab(k as ConversionSubTab)}
          testID="conversion-tab-toggle"
        />
      </View>
      {tab === 'recetas' && (
        <>
          <View paddingHorizontal={16} paddingVertical={8}>
            {canCreateReceta ? (
              <Btn variant="primary" onPress={() => setRecetaModalOpen(true)}
                fullWidth testID="conversion-nueva-receta-btn">
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
            recetas={recetasQ.data ?? []}
            products={productMap}
            onConvertir={setConvertir}
            onEliminar={(r) => eliminarReceta.mutate(r.id)}
          />
        </>
      )}
      {tab === 'historial' && (
        <ConversionHistorial
          conversiones={conversionesQ.data ?? []}
          products={productMap}
        />
      )}
      <NuevaRecetaModal
        open={recetaModalOpen}
        onClose={() => setRecetaModalOpen(false)}
        onSubmit={(input) =>
          crearReceta.mutate(input, { onSuccess: () => setRecetaModalOpen(false) })
        }
        submitting={crearReceta.isPending}
        materiasPrimas={mps}
        productosVenta={ventas}
      />
      <ConvertirSheet
        open={convertir !== null}
        onClose={() => setConvertir(null)}
        receta={convertir}
        products={productMap}
        stockMap={stockMap}
        onConfirm={(mult) => {
          if (!convertir) return;
          ejecutar.mutate(
            { recetaId: convertir.id, multiplicador: mult },
            { onSuccess: () => setConvertir(null) },
          );
        }}
        submitting={ejecutar.isPending}
      />
    </View>
  );
}
