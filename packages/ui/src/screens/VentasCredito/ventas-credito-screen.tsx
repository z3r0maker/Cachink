/**
 * VentasCreditoScreen — report + mutation screen for credit sales.
 * Shows outstanding KPI, groups credit sales by client, and allows
 * registering payments via a modal.
 *
 * Part C3 of the feature-flagged screens plan.
 */

import { useState, type ReactElement } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import { formatMoney, today, type Sale } from '@cachink/domain';
import { Btn, Card, ErrorState, Kpi, PeriodPicker, SectionTitle, Skeleton } from '../../components/index';
import type { PeriodoState } from '../../components/PeriodPicker/period-picker';
import { useTranslation } from '../../i18n/index';
import { useVentasCredito } from '../../hooks/use-ventas-credito';
import { useRegistrarPago } from '../../hooks/use-registrar-pago';
import { usePeriodLabels } from '../../hooks/use-period-labels';
import { defaultPeriodoState, usePeriodoRange } from '../../hooks/use-periodo-range';
import { useCurrentBusinessId } from '../../app-config/index';
import { colors, typography } from '../../theme';
import { EmptyVentasCredito } from './empty-ventas-credito';
import { RegistrarPagoModal } from '../Clientes/registrar-pago-modal';

export interface VentasCreditoScreenProps {
  readonly testID?: string;
}

export function VentasCreditoScreen(props: VentasCreditoScreenProps): ReactElement {
  const { t } = useTranslation();
  const periodLabels = usePeriodLabels();
  const [periodo, setPeriodo] = useState<PeriodoState>(defaultPeriodoState);
  const range = usePeriodoRange(periodo);
  const { data: rows, isLoading, error } = useVentasCredito(range.from, range.to);
  const registrarPago = useRegistrarPago();
  const businessId = useCurrentBusinessId();

  const [selectedVenta, setSelectedVenta] = useState<Sale | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const totalPendiente =
    rows?.reduce((acc, r) => acc + r.totalPendienteCentavos, 0n) ?? 0n;

  return (
    <ScrollView testID={props.testID ?? 'ventas-credito-screen'}>
      <View padding={16} gap={16}>
        <SectionTitle title={t('ventasCredito.title')} />
        <PeriodPicker value={periodo} onChange={setPeriodo} labels={periodLabels} />

        <Kpi
          label={t('ventasCredito.totalPendiente')}
          value={formatMoney(totalPendiente)}
          tone={totalPendiente > 0n ? 'negative' : 'neutral'}
        />

        {isLoading && (
          <View gap={8}>
            <Skeleton.Row index={0} testIDPrefix="credito-skeleton" />
            <Skeleton.Row index={1} testIDPrefix="credito-skeleton" />
          </View>
        )}

        {error !== null && !isLoading && (
          <ErrorState
            title={t('common.error')}
            body={error.message}
            testID="credito-error"
          />
        )}

        {rows !== undefined && rows.length === 0 && <EmptyVentasCredito />}

        {rows?.map((row) => {
          const key = (row.clienteId as string) ?? '__sin-cliente__';
          const isExpanded = expandedClient === key;
          return (
            <Card key={key} padding="md" fullWidth testID={`credito-client-${key}`}>
              <Pressable
                onPress={() => setExpandedClient(isExpanded ? null : key)}
                testID={`credito-toggle-${key}`}
              >
                <View
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Text
                    fontFamily={typography.fontFamily}
                    fontWeight={typography.weights.bold}
                    fontSize={15}
                    color={colors.black}
                  >
                    {row.clienteNombre}
                  </Text>
                  <Text
                    fontFamily={typography.fontFamily}
                    fontWeight={typography.weights.black}
                    fontSize={15}
                    color={colors.red}
                  >
                    {formatMoney(row.totalPendienteCentavos)}
                  </Text>
                </View>
              </Pressable>

              {isExpanded &&
                row.ventas.map((v) => (
                  <View
                    key={v.id}
                    flexDirection="row"
                    justifyContent="space-between"
                    alignItems="center"
                    paddingVertical={8}
                    paddingLeft={8}
                    borderTopWidth={1}
                    borderTopColor={colors.gray200}
                  >
                    <View flex={1} gap={2}>
                      <Text
                        fontFamily={typography.fontFamily}
                        fontWeight={typography.weights.medium}
                        fontSize={13}
                        color={colors.black}
                      >
                        {v.concepto}
                      </Text>
                      <Text
                        fontFamily={typography.fontFamily}
                        fontSize={12}
                        color={colors.gray400}
                      >
                        {v.fecha} · {formatMoney(v.monto)}
                      </Text>
                    </View>
                    <Btn
                      variant="ghost"
                      size="sm"
                      onPress={() => setSelectedVenta(v)}
                      testID={`pagar-btn-${v.id}`}
                    >
                      {t('ventasCredito.registrarPago')}
                    </Btn>
                  </View>
                ))}
            </Card>
          );
        })}
      </View>

      {selectedVenta !== null && businessId !== null && (
        <RegistrarPagoModal
          venta={selectedVenta}
          open
          onClose={() => setSelectedVenta(null)}
          onSubmit={(input) => {
            registrarPago.mutate(input, {
              onSuccess: () => setSelectedVenta(null),
            });
          }}
          saldoPendiente={selectedVenta.monto}
          businessId={businessId}
          fecha={today()}
          submitting={registrarPago.isPending}
        />
      )}
    </ScrollView>
  );
}
