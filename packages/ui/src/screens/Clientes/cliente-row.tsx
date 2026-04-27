/**
 * `<ClienteRow>` + helpers — the card row rendered inside
 * `<ClientesList>`. Extracted out of `clientes-screen.tsx` so the
 * screen file stays under the §4.4 200-line cap once Audit Round 2
 * K4 added swipe-to-edit / swipe-to-delete plumbing.
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Client, Money } from '@cachink/domain';
import { formatMoney } from '@cachink/domain';
import { Card, Tag } from '../../components/index';
import { colors, typography } from '../../theme';
import type { ClienteWithSaldo } from './clientes-screen';

function ClienteInfo({ cliente }: { cliente: Client }): ReactElement {
  return (
    <View flex={1} paddingRight={12}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={16}
        color={colors.black}
      >
        {cliente.nombre}
      </Text>
      {cliente.telefono && (
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.medium}
          fontSize={12}
          color={colors.gray600}
          marginTop={2}
        >
          {cliente.telefono}
        </Text>
      )}
    </View>
  );
}

function SaldoBadge({ saldo, saldoLabel }: { saldo: Money; saldoLabel: string }): ReactElement {
  return (
    <View alignItems="flex-end" gap={2}>
      <Tag variant="warning">{saldoLabel}</Tag>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={16}
        color={colors.warning}
      >
        {formatMoney(saldo)}
      </Text>
    </View>
  );
}

export interface ClienteRowProps {
  readonly item: ClienteWithSaldo;
  readonly onPress?: () => void;
  readonly saldoLabel: string;
}

export function ClienteRow({ item, onPress, saldoLabel }: ClienteRowProps): ReactElement {
  const hasSaldo = (item.saldoPendiente as bigint) > 0n;
  return (
    <Card testID={`cliente-card-${item.cliente.id}`} padding="md" onPress={onPress} fullWidth>
      <View flexDirection="row" justifyContent="space-between" alignItems="center">
        <ClienteInfo cliente={item.cliente} />
        {hasSaldo && <SaldoBadge saldo={item.saldoPendiente} saldoLabel={saldoLabel} />}
      </View>
    </Card>
  );
}
