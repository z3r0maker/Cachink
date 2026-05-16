/**
 * Expo Router entry for /caja-movimientos — cash movement history.
 *
 * Shows a scrollable log of all cash events (deposits, withdrawals)
 * for the current or past turns.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import { useQuery } from '@tanstack/react-query';
import { formatMoney, today, type BusinessId } from '@cachink/domain';
import { useCajaMovimientosRepository, useCurrentBusinessId } from '@cachink/ui';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function CajaMovimientosRoute(): ReactElement {
  const router = useRouter();
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const movRepo = useCajaMovimientosRepository();
  const fecha = today();

  const movQ = useQuery({
    queryKey: ['caja-movimientos-history', fecha, businessId],
    queryFn: () =>
      businessId
        ? movRepo.findByDateRange(fecha, fecha, businessId)
        : [],
    enabled: businessId !== null,
  });

  const movimientos = movQ.data ?? [];

  return (
    <AppShellWrapper activeTabKey="otros" onBack={() => router.back()}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text fontWeight="900" fontSize={28} color="$color">
          Movimientos de Caja
        </Text>
        <Text fontSize={14} color="$gray10">
          {`Hoy · ${movimientos.length} movimientos`}
        </Text>

        {movimientos.length === 0 && (
          <Text fontSize={14} color="$gray10" textAlign="center" paddingVertical={40}>
            Sin movimientos registrados hoy
          </Text>
        )}

        {movimientos.map((mov) => (
          <View
            key={mov.id}
            backgroundColor="$background"
            borderRadius={8}
            borderWidth={2}
            borderColor="$borderColor"
            padding={12}
            gap={4}
          >
            <View flexDirection="row" justifyContent="space-between">
              <Text fontWeight="700" fontSize={16}>
                {mov.tipo === 'deposito' ? '+ Depósito' : '− Retiro'}
              </Text>
              <Text
                fontWeight="900"
                fontSize={16}
                color={mov.tipo === 'deposito' ? '$green10' : '$red10'}
              >
                {formatMoney(mov.montoCentavos)}
              </Text>
            </View>
            <Text fontSize={13} color="$gray10">
              {mov.motivo}
            </Text>
          </View>
        ))}
      </ScrollView>
    </AppShellWrapper>
  );
}
