/**
 * ClienteDetailScreen — full cliente detail (Slice 2 C27).
 *
 * Renders cliente info, saldo hero card, list of pending ventas, and
 * a pagos history summary. Each pending venta has a 'Registrar pago'
 * Btn; the parent wires RegistrarPagoModal.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Client, ClientPayment, Money, Sale } from '@cachink/domain';
import { formatDate, formatMoney } from '@cachink/domain';
import { Btn, Card, EmptyState, List, SectionTitle, Tag } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface ClienteDetailScreenProps {
  readonly cliente: Client;
  readonly pendingSales: readonly Sale[];
  readonly pagosByVenta: ReadonlyMap<string, readonly ClientPayment[]>;
  readonly saldoPendiente: Money;
  readonly onRegistrarPago: (venta: Sale) => void;
  readonly onEditar?: () => void;
  readonly testID?: string;
}

function SaldoCard({
  saldo,
  t,
}: {
  saldo: Money;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  const hasSaldo = (saldo as bigint) > 0n;
  return (
    <Card variant={hasSaldo ? 'yellow' : 'white'} padding="md" fullWidth>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={12}
        letterSpacing={typography.letterSpacing.wide}
        color={colors.gray600}
        style={{ textTransform: 'uppercase' }}
      >
        {t('cuentasPorCobrar.title')}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={36}
        color={hasSaldo ? colors.warning : colors.black}
        letterSpacing={typography.letterSpacing.tighter}
      >
        {formatMoney(saldo)}
      </Text>
    </Card>
  );
}

function VentaInfo({ venta }: { venta: Sale }): ReactElement {
  return (
    <View flex={1} paddingRight={12}>
      <Text fontWeight={typography.weights.bold} fontSize={15} color={colors.black}>
        {venta.concepto}
      </Text>
      <Text fontWeight={typography.weights.medium} fontSize={12} color={colors.gray600}>
        {formatDate(venta.fecha)}
      </Text>
      <View flexDirection="row" gap={6} marginTop={4}>
        <Tag variant="warning">{venta.estadoPago}</Tag>
      </View>
    </View>
  );
}

function VentaActions({
  ventaId,
  saldo,
  onRegistrarPago,
  t,
}: {
  ventaId: string;
  saldo: Money;
  onRegistrarPago: () => void;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <View alignItems="flex-end" gap={6}>
      <Text fontWeight={typography.weights.black} fontSize={16} color={colors.warning}>
        {formatMoney(saldo)}
      </Text>
      <Btn variant="green" size="sm" onPress={onRegistrarPago} testID={`registrar-pago-${ventaId}`}>
        {t('nuevaVenta.save')}
      </Btn>
    </View>
  );
}

function VentaPendienteRow(props: {
  venta: Sale;
  pagos: readonly ClientPayment[];
  onRegistrarPago: () => void;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  const paid = props.pagos.reduce((acc, p) => acc + (p.montoCentavos as bigint), 0n);
  const saldo = ((props.venta.monto as bigint) - paid) as Money;
  return (
    <Card testID={`pending-venta-${props.venta.id}`} padding="md" fullWidth>
      <View flexDirection="row" justifyContent="space-between" alignItems="center">
        <VentaInfo venta={props.venta} />
        <VentaActions
          ventaId={props.venta.id}
          saldo={saldo}
          onRegistrarPago={props.onRegistrarPago}
          t={props.t}
        />
      </View>
    </Card>
  );
}

function PendingVentasList({
  props,
  t,
}: {
  props: ClienteDetailScreenProps;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <List<Sale>
      data={props.pendingSales}
      keyExtractor={(venta) => venta.id}
      renderItem={(venta) => (
        <View marginBottom={10}>
          <VentaPendienteRow
            venta={venta}
            pagos={props.pagosByVenta.get(venta.id) ?? []}
            onRegistrarPago={() => props.onRegistrarPago(venta)}
            t={t}
          />
        </View>
      )}
      ListEmptyComponent={
        <EmptyState
          icon="check"
          title={t('cuentasPorCobrar.empty')}
          testID="cliente-detail-empty"
        />
      }
      testID="cliente-detail-pending-list"
    />
  );
}

export function ClienteDetailScreen(props: ClienteDetailScreenProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      testID={props.testID ?? 'cliente-detail-screen'}
      flex={1}
      padding={16}
      gap={12}
      backgroundColor={colors.offwhite}
    >
      <SectionTitle
        title={props.cliente.nombre}
        action={
          props.onEditar && (
            <Btn variant="ghost" size="sm" onPress={props.onEditar} testID="cliente-editar">
              {t('actions.edit')}
            </Btn>
          )
        }
      />
      <SaldoCard saldo={props.saldoPendiente} t={t} />
      <SectionTitle title={t('cuentasPorCobrar.title')} />
      <PendingVentasList props={props} t={t} />
    </View>
  );
}
