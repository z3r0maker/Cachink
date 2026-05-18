/**
 * CancelacionesScreen — list of today's sales with cancel capability.
 *
 * Shows active and cancelled sales for the current date. Tapping
 * "Cancelar" triggers the cancellation flow (PIN → reason → confirm).
 */

import { useState, type ReactElement } from 'react';
import { ScrollView, View as RNView } from 'react-native';
import { Text } from '@tamagui/core';
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

function useCancelacionesData() {
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const salesRepo = useSalesRepository();
  const fecha = today();
  const salesQ = useQuery({
    queryKey: ['cancelaciones-sales', fecha, businessId],
    queryFn: () => (businessId ? salesRepo.findByDate(fecha, businessId) : []),
    enabled: businessId !== null,
  });
  return { sales: salesQ.data ?? [], refetch: salesQ.refetch };
}

function SalesList(props: { sales: readonly Sale[]; onCancel: (s: Sale) => void }): ReactElement {
  if (props.sales.length === 0) {
    return (
      <Text
        fontFamily={typography.fontFamily}
        fontSize={14}
        color={colors.gray400}
        textAlign="center"
        paddingVertical={40}
      >
        No hay ventas registradas hoy
      </Text>
    );
  }
  return (
    <>
      {props.sales.map((sale) => (
        <SaleCancelCard
          key={sale.id}
          sale={sale}
          onCancel={sale.cancelledAt || sale.deletedAt ? undefined : () => props.onCancel(sale)}
          testID={`sale-card-${sale.id}`}
        />
      ))}
    </>
  );
}

export function CancelacionesScreen(_props: CancelacionesScreenProps): ReactElement {
  const { sales, refetch } = useCancelacionesData();
  const [cancelTarget, setCancelTarget] = useState<Sale | null>(null);
  return (
    <RNView
      testID={_props.testID ?? 'cancelaciones-screen'}
      style={{ flex: 1, backgroundColor: colors.offwhite }}
    >
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
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
        >{`Hoy · ${sales.length} ventas`}</Text>
        <SalesList sales={sales} onCancel={setCancelTarget} />
      </ScrollView>
      {cancelTarget !== null && (
        <CancellationFlow
          sale={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onSuccess={() => {
            setCancelTarget(null);
            refetch();
          }}
        />
      )}
    </RNView>
  );
}
