/**
 * Desktop route adapter for /productos/:id — inline-editable product
 * detail page.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { IsoDate } from '@cachink/domain';
import {
  ProductoDetailSmart,
  useProductosConStock,
  useProductFormStore,
} from '@cachink/ui';
import { useDesktopNavigate } from '../desktop-router-context';

function todayIso(): IsoDate {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as IsoDate;
}

export function ProductoDetailDesktopRoute(props: {
  readonly productId: string;
}): ReactElement {
  const navigate = useDesktopNavigate();
  const itemsQ = useProductosConStock();
  const items = itemsQ.data ?? [];
  const row = items.find((r) => r.producto.id === props.productId) ?? null;
  const setDraft = useProductFormStore((s) => s.setDraft);

  if (!row) {
    return (
      <View flex={1} alignItems="center" justifyContent="center">
        <Text>Producto no encontrado</Text>
      </View>
    );
  }

  const handleSelectIcon = (): void => {
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
    navigate('/productos/icon-picker');
  };

  return (
    <ProductoDetailSmart
      row={row}
      fecha={todayIso()}
      onBack={() => navigate('/productos')}
      onSelectIcon={handleSelectIcon}
    />
  );
}
