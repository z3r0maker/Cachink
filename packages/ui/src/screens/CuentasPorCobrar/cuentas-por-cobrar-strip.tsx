/**
 * CuentasPorCobrarStrip — Director-only read-only view of pending
 * Crédito sales grouped by cliente (P1C C16).
 *
 * Minimal implementation for the Maestro E2E flow in Commit 17. The
 * full Director Home integration lands in P1C-M10 — for now a
 * standalone route renders this strip so the test can assert the
 * credit venta appears under its cliente.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Client, Money, Sale } from '@cachink/domain';
import { formatMoney } from '@cachink/domain';
import { Card, EmptyState, List, SectionTitle, Tag } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface CuentaPorCobrarRow {
  readonly cliente: Client;
  readonly ventas: readonly Sale[];
  readonly total: Money;
}

export interface CuentasPorCobrarStripProps {
  readonly rows: readonly CuentaPorCobrarRow[];
  readonly testID?: string;
}

function Row({ row }: { row: CuentaPorCobrarRow }): ReactElement {
  return (
    <Card testID={`cxc-row-${row.cliente.id}`} padding="md" fullWidth>
      <View flexDirection="row" justifyContent="space-between" alignItems="center">
        <View flex={1} paddingRight={12}>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.bold}
            fontSize={16}
            color={colors.black}
          >
            {row.cliente.nombre}
          </Text>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.medium}
            fontSize={12}
            color={colors.gray600}
            marginTop={4}
          >
            {row.ventas.length}
          </Text>
        </View>
        <View alignItems="flex-end" gap={4}>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.black}
            fontSize={20}
            color={colors.black}
          >
            {formatMoney(row.total)}
          </Text>
          <Tag variant="warning">{row.ventas[0]?.estadoPago ?? 'pendiente'}</Tag>
        </View>
      </View>
    </Card>
  );
}

export function CuentasPorCobrarStrip(props: CuentasPorCobrarStripProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      testID={props.testID ?? 'cuentas-por-cobrar-strip'}
      padding={16}
      gap={10}
      backgroundColor={colors.offwhite}
    >
      <SectionTitle title={t('cuentasPorCobrar.title')} />
      <List<CuentaPorCobrarRow>
        data={props.rows}
        keyExtractor={(row) => row.cliente.id}
        renderItem={(row) => <Row row={row} />}
        ListEmptyComponent={<EmptyState icon="check" title={t('cuentasPorCobrar.empty')} />}
        testID="cuentas-por-cobrar-list"
      />
    </View>
  );
}
