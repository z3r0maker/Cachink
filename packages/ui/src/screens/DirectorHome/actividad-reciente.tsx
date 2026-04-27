/**
 * ActividadReciente — Director Home card showing the merged latest
 * ventas + egresos for today (P1C-M10-T04, S4-C5).
 *
 * Composes `useActividadReciente(today, limit)`. Rows are tappable;
 * taps bubble up via onVentaPress / onEgresoPress. Empty state renders
 * a friendly EmptyState for days with no activity yet.
 */

import { useMemo, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Expense, IsoDate, Sale } from '@cachink/domain';
import { formatMoney } from '@cachink/domain';
import { Card, EmptyState, List, SectionTitle, Tag } from '../../components/index';
import { useActividadReciente, type ActividadEntry } from '../../hooks/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { todayIso } from './hoy-kpi-strip';

export interface ActividadRecienteProps {
  readonly onVentaPress?: (venta: Sale) => void;
  readonly onEgresoPress?: (egreso: Expense) => void;
  readonly limit?: number;
  readonly testID?: string;
  readonly now?: Date;
}

function RowBody({
  titulo,
  tag,
  amountText,
  amountColor,
}: {
  titulo: string;
  tag: string;
  amountText: string;
  amountColor: string;
}): ReactElement {
  return (
    <View flexDirection="row" justifyContent="space-between" alignItems="center">
      <View flex={1} paddingRight={12}>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={14}
          color={colors.black}
        >
          {titulo}
        </Text>
        <Tag>{tag}</Tag>
      </View>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={16}
        color={amountColor}
      >
        {amountText}
      </Text>
    </View>
  );
}

function EntryRow({
  entry,
  onPress,
}: {
  entry: ActividadEntry;
  onPress?: () => void;
}): ReactElement {
  const isVenta = entry.kind === 'venta';
  const testID = `${isVenta ? 'actividad-venta' : 'actividad-egreso'}-${entry.item.id}`;
  const body = isVenta ? (
    <RowBody
      titulo={entry.item.concepto}
      tag={(entry.item as Sale).metodo}
      amountText={`+${formatMoney(entry.item.monto)}`}
      amountColor={colors.green}
    />
  ) : (
    <RowBody
      titulo={entry.item.concepto}
      tag={(entry.item as Expense).categoria}
      amountText={`−${formatMoney(entry.item.monto)}`}
      amountColor={colors.red}
    />
  );
  return (
    <Card testID={testID} padding="md" onPress={onPress} fullWidth>
      {body}
    </Card>
  );
}

export function ActividadReciente(props: ActividadRecienteProps): ReactElement {
  const { t } = useTranslation();
  const today = useMemo<IsoDate>(() => todayIso(props.now), [props.now]);
  const { entries } = useActividadReciente(today, props.limit ?? 6);

  return (
    <View testID={props.testID ?? 'actividad-reciente'} gap={10}>
      <SectionTitle title={t('directorHome.actividadTitle')} />
      <List<ActividadEntry>
        data={entries}
        keyExtractor={(entry) => `${entry.kind}-${entry.item.id}`}
        renderItem={(entry) => (
          <EntryRow
            entry={entry}
            onPress={() => {
              if (entry.kind === 'venta') props.onVentaPress?.(entry.item);
              else props.onEgresoPress?.(entry.item);
            }}
          />
        )}
        ListEmptyComponent={<EmptyState icon="info" title={t('directorHome.actividadEmpty')} />}
        testID="actividad-reciente-list"
      />
    </View>
  );
}
