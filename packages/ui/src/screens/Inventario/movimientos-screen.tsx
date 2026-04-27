/**
 * MovimientosScreen — list of recent inventory movements (Slice 2
 * C13, M5-T02). Pure UI; takes movimientos + productos map as props.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { InventoryMovement, Product, ProductId } from '@cachink/domain';
import { EmptyState, List, SectionTitle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import { MovimientoCard } from './movimiento-card';

export interface MovimientosScreenProps {
  readonly movimientos: readonly InventoryMovement[];
  readonly productosById: ReadonlyMap<ProductId, Product>;
  readonly testID?: string;
}

export function MovimientosScreen(props: MovimientosScreenProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      testID={props.testID ?? 'movimientos-screen'}
      flex={1}
      padding={16}
      gap={10}
      backgroundColor={colors.offwhite}
    >
      <SectionTitle title={t('inventario.movimientosTab')} />
      <List<InventoryMovement>
        data={props.movimientos}
        keyExtractor={(mov) => mov.id}
        renderItem={(mov) => (
          <View marginBottom={10}>
            <MovimientoCard
              movimiento={mov}
              producto={props.productosById.get(mov.productoId) ?? null}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="archive"
            title={t('inventario.movimientoEmptyTitle')}
            description={t('inventario.movimientoEmptyBody')}
            testID="empty-movimientos"
          />
        }
        testID="movimientos-list"
      />
    </View>
  );
}
