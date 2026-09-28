/**
 * «Compra de inventario» (the phone's inventory purchase, kept from the old
 * Nuevo egreso modal and restyled): the product, how many and what each one
 * cost, through `RegistrarMovimientoInventarioUseCase`, which records the
 * stock entry and its egreso together (ADR-021).
 */
import { useCallback, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { BusinessId, IsoDate, NewInventoryMovement } from '@xangarro/domain';
import { BottomSheet } from '../../components/BottomSheet/index';
import { MText } from '../../components/Mostrador/index';
import { useCurrentBusinessId } from '../../app-config/index';
import { useProductos } from '../../hooks/use-productos';
import { useRegistrarMovimiento } from '../../hooks/use-registrar-movimiento';
import { colors } from '../../theme';
import { InventarioTab } from './compra-inventario-form';

export interface CompraInventarioSheetProps {
  readonly open: boolean;
  readonly fecha: IsoDate;
  readonly onClose: () => void;
  /** After it is saved: the screen confirms with a toast. */
  readonly onHecho: (texto: string) => void;
}

function useEnviar(onHecho: (texto: string) => void) {
  const productos = useProductos().data ?? [];
  const registrar = useRegistrarMovimiento();
  const enviar = useCallback(
    (input: NewInventoryMovement) => {
      const nombre = productos.find((x) => x.id === input.productoId)?.nombre ?? 'el producto';
      registrar.mutate(input, {
        onSuccess: () => onHecho(`Entraron ${input.cantidad} de ${nombre} al inventario.`),
      });
    },
    [registrar, productos, onHecho],
  );
  return { productos, enviar, enviando: registrar.isPending };
}

export function CompraInventarioSheet(p: CompraInventarioSheetProps): ReactElement {
  const businessId = useCurrentBusinessId();
  const { productos, enviar, enviando } = useEnviar(p.onHecho);
  return (
    <BottomSheet
      open={p.open}
      onClose={p.onClose}
      eyebrow="Llegó mercancía"
      title="Compra de inventario"
      closeLabel="Cerrar sin registrar"
      testID="compra-inventario"
    >
      <View gap={14}>
        <MText size="sm" weight="semibold" color={colors.gray600}>
          Entra al inventario con su costo y queda como gasto de compra.
        </MText>
        {productos.length === 0 ? (
          <MText testID="compra-sin-productos" size="md" weight="bold">
            Todavía no hay productos en la caja. Cuando el dueño los dé de alta, aquí los eliges.
          </MText>
        ) : (
          <InventarioTab
            businessId={(businessId ?? '') as BusinessId}
            fecha={p.fecha}
            productos={productos}
            onSubmit={enviar}
            submitting={enviando}
          />
        )}
      </View>
    </BottomSheet>
  );
}
