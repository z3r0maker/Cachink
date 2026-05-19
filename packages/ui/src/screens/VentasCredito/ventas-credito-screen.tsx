/**
 * VentasCreditoScreen — report + mutation screen for credit sales.
 * Shows outstanding KPI, groups credit sales by client, and allows
 * registering payments via a modal.
 *
 * Part C3 of the feature-flagged screens plan.
 */

import { useState, type ReactElement } from 'react';
import { ScrollView, View as RNView } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney, today, type Sale } from '@cachink/domain';
import { ErrorState, Kpi, PeriodPicker, SectionTitle, Skeleton } from '../../components/index';
import type { PeriodoState } from '../../components/PeriodPicker/period-picker';
import { useTranslation } from '../../i18n/index';
import { useVentasCredito } from '../../hooks/use-ventas-credito';
import { useRegistrarPago } from '../../hooks/use-registrar-pago';
import { usePeriodLabels } from '../../hooks/use-period-labels';
import { defaultPeriodoState, usePeriodoRange } from '../../hooks/use-periodo-range';
import { useCurrentBusinessId } from '../../app-config/index';
import { EmptyVentasCredito } from './empty-ventas-credito';
import { CreditoClientCard } from './credito-client-card';
import { RegistrarPagoModal } from '../Clientes/registrar-pago-modal';

export interface VentasCreditoScreenProps {
  readonly testID?: string;
}

function useCreditoState() {
  const periodLabels = usePeriodLabels();
  const [periodo, setPeriodo] = useState<PeriodoState>(defaultPeriodoState);
  const range = usePeriodoRange(periodo);
  const query = useVentasCredito(range.from, range.to);
  const registrarPago = useRegistrarPago();
  const businessId = useCurrentBusinessId();
  const [selectedVenta, setSelectedVenta] = useState<Sale | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const totalPendiente = query.data?.reduce((acc, r) => acc + r.totalPendienteCentavos, 0n) ?? 0n;
  return {
    periodLabels,
    periodo,
    setPeriodo,
    query,
    registrarPago,
    businessId,
    selectedVenta,
    setSelectedVenta,
    expandedClient,
    setExpandedClient,
    totalPendiente,
  };
}

export function VentasCreditoScreen(props: VentasCreditoScreenProps): ReactElement {
  const { t } = useTranslation();
  const s = useCreditoState();

  return (
    <RNView testID={props.testID ?? 'ventas-credito-screen'} style={{ flex: 1 }}>
      <ScrollView>
        <View padding={16} gap={16}>
          <SectionTitle title={t('ventasCredito.title')} />
          <PeriodPicker value={s.periodo} onChange={s.setPeriodo} labels={s.periodLabels} />
          <Kpi
            label={t('ventasCredito.totalPendiente')}
            value={formatMoney(s.totalPendiente)}
            tone={s.totalPendiente > 0n ? 'negative' : 'neutral'}
          />
          <CreditoBody
            query={s.query}
            expandedClient={s.expandedClient}
            onToggle={(k) => s.setExpandedClient(s.expandedClient === k ? null : k)}
            onPagar={s.setSelectedVenta}
          />
        </View>
        <CreditoPagoModal state={s} />
      </ScrollView>
    </RNView>
  );
}

function CreditoBody(props: {
  query: ReturnType<typeof useVentasCredito>;
  expandedClient: string | null;
  onToggle: (key: string) => void;
  onPagar: (v: Sale) => void;
}): ReactElement {
  const { t } = useTranslation();
  const { data: rows, isLoading, error } = props.query;
  if (isLoading)
    return (
      <View gap={8}>
        <Skeleton.Row index={0} testIDPrefix="credito-skeleton" />
        <Skeleton.Row index={1} testIDPrefix="credito-skeleton" />
      </View>
    );
  if (error !== null && !isLoading)
    return <ErrorState title={t('common.error')} body={error.message} testID="credito-error" />;
  if (rows !== undefined && rows.length === 0) return <EmptyVentasCredito />;
  return (
    <>
      {rows?.map((row) => {
        const key = (row.clienteId as string) ?? '__sin-cliente__';
        return (
          <CreditoClientCard
            key={key}
            row={row}
            isExpanded={props.expandedClient === key}
            onToggle={() => props.onToggle(key)}
            onPagar={props.onPagar}
          />
        );
      })}
    </>
  );
}

function CreditoPagoModal(props: {
  state: ReturnType<typeof useCreditoState>;
}): ReactElement | null {
  const { selectedVenta, businessId, registrarPago, setSelectedVenta } = props.state;
  if (selectedVenta === null || businessId === null) return null;
  return (
    <RegistrarPagoModal
      venta={selectedVenta}
      open
      onClose={() => setSelectedVenta(null)}
      onSubmit={(input) => {
        registrarPago.mutate(input, { onSuccess: () => setSelectedVenta(null) });
      }}
      saldoPendiente={selectedVenta.monto}
      businessId={businessId}
      fecha={today()}
      submitting={registrarPago.isPending}
    />
  );
}
