/**
 * CancelacionesScreen — list of today's sales with cancel capability.
 *
 * Shows active and cancelled sales for the current date. Tapping
 * "Cancelar" triggers the cancellation flow (PIN → reason → confirm).
 */

import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import { useQuery } from '@tanstack/react-query';
import type { BusinessId, Sale } from '@cachink/domain';
import { today } from '@cachink/domain';
import { useSalesRepository } from '../../app/repository-provider';
import { useCurrentBusinessId } from '../../app-config/use-app-config';
import { SaleCancelCard } from './sale-cancel-card';
import { CancellationFlow } from './cancellation-flow';
import { colors, typography } from '../../theme';

export interface CancelacionesScreenProps {
  readonly testID?: string;
}

export function CancelacionesScreen(
  _props: CancelacionesScreenProps,
): ReactElement {
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const salesRepo = useSalesRepository();
  const fecha = today();

  const salesQ = useQuery({
    queryKey: ['cancelaciones-sales', fecha, businessId],
    queryFn: () =>
      businessId ? salesRepo.findByDate(fecha, businessId) : [],
    enabled: businessId !== null,
  });

  const [cancelTarget, setCancelTarget] = useState<Sale | null>(null);
  const sales = salesQ.data ?? [];

  return (
    <View flex={1} backgroundColor={colors.offwhite}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12 }}
        testID={_props.testID ?? 'cancelaciones-screen'}
      >
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black.toString()}
          fontSize={28}
          color={colors.black}
        >
          Cancelaciones
        </Text>
        <Text
          fontFamily={typography.fontFamily}
          fontSize={14}
          color={colors.gray600}
        >
          {`Hoy · ${sales.length} ventas`}
        </Text>

        {sales.length === 0 && (
          <Text
            fontFamily={typography.fontFamily}
            fontSize={14}
            color={colors.gray400}
            textAlign="center"
            paddingVertical={40}
          >
            No hay ventas registradas hoy
          </Text>
        )}

        {sales.map((sale) => (
          <SaleCancelCard
            key={sale.id}
            sale={sale}
            onCancel={
              sale.cancelledAt || sale.deletedAt
                ? undefined
                : () => setCancelTarget(sale)
            }
            testID={`sale-card-${sale.id}`}
          />
        ))}
      </ScrollView>

      {cancelTarget !== null && (
        <CancellationFlow
          sale={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onSuccess={() => {
            setCancelTarget(null);
            salesQ.refetch();
          }}
        />
      )}
    </View>
  );
}
