/**
 * ClientesScreen — Clientes list (Slice 2 C25, M6-T01).
 *
 * Buscar input filters by nombre or telefono. Tap a row to open the
 * cliente detail. Pure UI — accepts clientes as prop.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Client, Money, Sale } from '@cachink/domain';
import { formatMoney } from '@cachink/domain';
import { Btn, Card, EmptyState, Input, SectionTitle, Tag } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface ClienteWithSaldo {
  readonly cliente: Client;
  readonly saldoPendiente: Money;
}

export interface ClientesScreenProps {
  readonly query: string;
  readonly onChangeQuery: (next: string) => void;
  readonly items: readonly ClienteWithSaldo[];
  readonly onNuevoCliente: () => void;
  readonly onClientePress?: (item: ClienteWithSaldo) => void;
  readonly testID?: string;
}

export function filterClientes(
  items: readonly ClienteWithSaldo[],
  query: string,
): readonly ClienteWithSaldo[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((row) => {
    const nombre = row.cliente.nombre.toLowerCase();
    const telefono = row.cliente.telefono?.toLowerCase() ?? '';
    return nombre.includes(q) || telefono.includes(q);
  });
}

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

function ClienteRow({
  item,
  onPress,
  saldoLabel,
}: {
  item: ClienteWithSaldo;
  onPress?: () => void;
  saldoLabel: string;
}): ReactElement {
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

function ClientesList({
  items,
  onClientePress,
  saldoLabel,
}: {
  items: readonly ClienteWithSaldo[];
  onClientePress?: (item: ClienteWithSaldo) => void;
  saldoLabel: string;
}): ReactElement {
  return (
    <View gap={10}>
      {items.map((row) => (
        <ClienteRow
          key={row.cliente.id}
          item={row}
          onPress={onClientePress ? () => onClientePress(row) : undefined}
          saldoLabel={saldoLabel}
        />
      ))}
    </View>
  );
}

export function ClientesScreen(props: ClientesScreenProps): ReactElement {
  const { t } = useTranslation();
  const filtered = filterClientes(props.items, props.query);
  return (
    <View
      testID={props.testID ?? 'clientes-screen'}
      flex={1}
      padding={16}
      gap={12}
      backgroundColor={colors.offwhite}
    >
      <SectionTitle
        title={t('clientes.title')}
        action={
          <Btn variant="primary" onPress={props.onNuevoCliente} testID="clientes-nuevo">
            {t('actions.new')}
          </Btn>
        }
      />
      <Input
        label={t('inventario.buscar')}
        value={props.query}
        onChange={props.onChangeQuery}
        testID="clientes-buscar"
      />
      {filtered.length === 0 ? (
        <EmptyState emoji="👥" title={t('clientes.title')} testID="empty-clientes" />
      ) : (
        <ClientesList
          items={filtered}
          onClientePress={props.onClientePress}
          saldoLabel={t('cuentasPorCobrar.title')}
        />
      )}
    </View>
  );
}

// Silence "Sale type exported but unused" — the type is here to keep
// the same import surface shape as the Ventas + Egresos screens.
export type { Sale };
