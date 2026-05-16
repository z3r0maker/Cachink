/**
 * CajaActiveTurnView — shows balance + deposit/withdraw + cerrar buttons
 * for an open caja turn.
 *
 * Extracted from caja-content.tsx to respect 200-line budget.
 */

import { type ReactElement } from 'react';
import { View } from '@tamagui/core';
import { useQuery } from '@tanstack/react-query';
import type { BusinessId, CajaTurno } from '@cachink/domain';
import { computeCajaBalance } from '@cachink/domain';
import { CajaStatusCard } from './caja-status-card';
import { CajaBalanceCard } from './caja-balance-card';
import { Btn } from '../../components/Btn/btn';
import { useTranslation } from '../../i18n/index';
import {
  useSalesRepository,
  useExpensesRepository,
  useCajaMovimientosRepository,
} from '../../app/repository-provider';
import { useCurrentBusinessId } from '../../app-config/use-app-config';

export interface CajaActiveTurnViewProps {
  readonly turno: CajaTurno;
  readonly onCerrar: () => void;
  readonly onDeposit: () => void;
  readonly onWithdraw: () => void;
}

export function CajaActiveTurnView(props: CajaActiveTurnViewProps): ReactElement {
  const { t } = useTranslation();
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const salesRepo = useSalesRepository();
  const expensesRepo = useExpensesRepository();
  const movRepo = useCajaMovimientosRepository();

  const salesQ = useQuery({
    queryKey: ['caja-balance-sales', props.turno.id],
    queryFn: () =>
      businessId
        ? salesRepo.findByDateRange(props.turno.fecha, props.turno.fecha, businessId)
        : [],
    enabled: businessId !== null,
  });
  const expensesQ = useQuery({
    queryKey: ['caja-balance-expenses', props.turno.id],
    queryFn: () =>
      businessId
        ? expensesRepo.findByDateRange(props.turno.fecha, props.turno.fecha, businessId)
        : [],
    enabled: businessId !== null,
  });
  const movQ = useQuery({
    queryKey: ['caja-balance-movimientos', props.turno.id],
    queryFn: () => movRepo.findByTurno(props.turno.id),
  });

  const sales = salesQ.data ?? [];
  const expenses = expensesQ.data ?? [];
  const movimientos = movQ.data ?? [];
  const cashSales = sales.filter((s) => s.metodo === 'Efectivo' && !s.cancelledAt);

  const balance = computeCajaBalance({
    aperturaCentavos: props.turno.montoAperturaCentavos,
    adicionalCentavos: props.turno.efectivoAdicionalCentavos,
    ventasEfectivoCentavos: cashSales.map((s) => s.monto),
    efectivoRecibidoPorVenta: cashSales
      .filter((s) => s.efectivoRecibidoCentavos != null)
      .map((s) => ({ monto: s.monto, efectivoRecibido: s.efectivoRecibidoCentavos! })),
    egresosEfectivoCentavos: expenses.map((e) => e.monto),
    depositosCentavos: movimientos
      .filter((m) => m.tipo === 'deposito')
      .map((m) => m.montoCentavos),
    retirosCentavos: movimientos
      .filter((m) => m.tipo === 'retiro')
      .map((m) => m.montoCentavos),
    cancelacionesEfectivoCentavos: sales
      .filter((s) => s.metodo === 'Efectivo' && s.cancelledAt != null)
      .map((s) => s.monto),
  });

  return (
    <View gap={12}>
      <CajaStatusCard turno={props.turno} onCerrar={props.onCerrar} />
      <CajaBalanceCard balance={balance} />
      <View flexDirection="row" gap={8}>
        <View flex={1}>
          <Btn variant="green" onPress={props.onDeposit} fullWidth testID="caja-deposit-btn">
            + Agregar efectivo
          </Btn>
        </View>
        <View flex={1}>
          <Btn variant="danger" onPress={props.onWithdraw} fullWidth testID="caja-withdraw-btn">
            − Retirar efectivo
          </Btn>
        </View>
      </View>
      <Btn variant="dark" onPress={props.onCerrar} fullWidth testID="caja-cerrar-btn">
        {t('caja.cerrarTitle')}
      </Btn>
    </View>
  );
}
