/**
 * Expo Router entry for /productos/[id] — inline-editable product
 * detail page. Dynamic route reads product ID from params.
 */

import type { ReactElement } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text, View } from '@tamagui/core';
import type { IsoDate } from '@cachink/domain';
import { ProductoDetailSmart, useProductosConStock, useProductFormStore } from '@cachink/ui';
import { AppShellWrapper } from '../../shell/app-shell-wrapper';

function NotFoundView({ onBack }: { onBack: () => void }): ReactElement {
  return (
    <AppShellWrapper activeTabKey="productos" onBack={onBack}>
      <View flex={1} alignItems="center" justifyContent="center">
        <Text>Producto no encontrado</Text>
      </View>
    </AppShellWrapper>
  );
}

function todayIso(): IsoDate {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as IsoDate;
}

export default function ProductoDetailRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const itemsQ = useProductosConStock();
  const items = itemsQ.data ?? [];
  const row = items.find((r) => r.producto.id === id) ?? null;
  const setDraft = useProductFormStore((s) => s.setDraft);

  if (!row) {
    return <NotFoundView onBack={() => router.back()} />;
  }

  const handleSelectIcon = (): void => {
    // Persist current form state to zustand before navigating
    setDraft({
      nombre: row.producto.nombre,
      sku: row.producto.sku ?? '',
      categoria: row.producto.categoria,
      usoProducto: row.producto.usoProducto ?? 'venta',
      costoPesos: '',
      precioVentaPesos: '',
      unidad: row.producto.unidad,
      umbral: String(row.producto.umbralStockBajo),
      colorFondo: row.producto.colorFondo ?? 'white',
      icono: row.producto.icono ?? null,
      editingProductId: row.producto.id,
    });
    router.push('/productos/icon-picker' as never);
  };

  return (
    <AppShellWrapper activeTabKey="productos" onBack={() => router.back()}>
      <ProductoDetailSmart
        row={row}
        fecha={todayIso()}
        onBack={() => router.back()}
        onSelectIcon={handleSelectIcon}
      />
    </AppShellWrapper>
  );
}
