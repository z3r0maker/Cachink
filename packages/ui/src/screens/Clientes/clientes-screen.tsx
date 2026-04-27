/**
 * ClientesScreen — Clientes list (Slice 2 C25, M6-T01).
 *
 * Buscar input filters by nombre or telefono. Tap a row to open the
 * cliente detail. Pure UI — accepts clientes as prop.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { Client, Money, Sale } from '@cachink/domain';
import {
  Btn,
  EmptyState,
  FAB,
  Icon,
  List,
  SearchBar,
  SectionTitle,
  SwipeableRow,
} from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import { ClienteRow } from './cliente-row';

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
  /** Audit 4.6 — opt-in mobile FAB for the primary action. */
  readonly showFab?: boolean;
  /** Audit Round 2 K4 — swipe-to-edit handler. */
  readonly onEditCliente?: (item: ClienteWithSaldo) => void;
  /** Audit Round 2 K4 — swipe-to-delete handler (route opens ConfirmDialog). */
  readonly onEliminarCliente?: (item: ClienteWithSaldo) => void;
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

interface ClientesListProps {
  readonly items: readonly ClienteWithSaldo[];
  readonly onClientePress?: (item: ClienteWithSaldo) => void;
  readonly onEditCliente?: (item: ClienteWithSaldo) => void;
  readonly onEliminarCliente?: (item: ClienteWithSaldo) => void;
  readonly saldoLabel: string;
}

function ClienteListRow(props: ClientesListProps & { row: ClienteWithSaldo }): ReactElement {
  const card = (
    <ClienteRow
      item={props.row}
      onPress={props.onClientePress ? () => props.onClientePress!(props.row) : undefined}
      saldoLabel={props.saldoLabel}
    />
  );
  const swipeEnabled = props.onEditCliente !== undefined || props.onEliminarCliente !== undefined;
  if (!swipeEnabled) return card;
  return (
    <SwipeableRow
      onSwipeLeft={props.onEditCliente ? () => props.onEditCliente!(props.row) : undefined}
      onSwipeRight={props.onEliminarCliente ? () => props.onEliminarCliente!(props.row) : undefined}
      testID={`cliente-swipe-${props.row.cliente.id}`}
    >
      {card}
    </SwipeableRow>
  );
}

function ClientesList(props: ClientesListProps): ReactElement {
  return (
    <View gap={10}>
      <List<ClienteWithSaldo>
        data={props.items}
        keyExtractor={(row) => row.cliente.id}
        renderItem={(row) => <ClienteListRow {...props} row={row} />}
        testID="clientes-list"
      />
    </View>
  );
}

function ClientesBody(
  props: ClientesScreenProps & {
    filtered: readonly ClienteWithSaldo[];
    saldoLabel: string;
    emptyTitle: string;
  },
): ReactElement {
  if (props.filtered.length === 0) {
    return <EmptyState icon="users" title={props.emptyTitle} testID="empty-clientes" />;
  }
  return (
    <ClientesList
      items={props.filtered}
      onClientePress={props.onClientePress}
      onEditCliente={props.onEditCliente}
      onEliminarCliente={props.onEliminarCliente}
      saldoLabel={props.saldoLabel}
    />
  );
}

function ClientesHeader({
  t,
  onNuevoCliente,
}: {
  t: ReturnType<typeof useTranslation>['t'];
  onNuevoCliente: () => void;
}): ReactElement {
  return (
    <SectionTitle
      title={t('clientes.title')}
      action={
        <Btn variant="primary" onPress={onNuevoCliente} testID="clientes-nuevo">
          {t('actions.new')}
        </Btn>
      }
    />
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
      <ClientesHeader t={t} onNuevoCliente={props.onNuevoCliente} />
      <SearchBar
        label={t('inventario.buscar')}
        value={props.query}
        onChange={props.onChangeQuery}
        testID="clientes-buscar"
      />
      <ClientesBody
        {...props}
        filtered={filtered}
        saldoLabel={t('cuentasPorCobrar.title')}
        emptyTitle={t('clientes.title')}
      />
      {props.showFab === true && (
        <FAB
          icon={<Icon name="plus" size={28} color={colors.black} />}
          ariaLabel={t('actions.new')}
          onPress={props.onNuevoCliente}
          testID="clientes-fab"
        />
      )}
    </View>
  );
}

// Silence "Sale type exported but unused" — the type is here to keep
// the same import surface shape as the Ventas + Egresos screens.
export type { Sale };
