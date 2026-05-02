/**
 * ActividadReciente — Director Home card showing the merged latest
 * ventas + egresos for today (P1C-M10-T04, S4-C5).
 *
 * Composes `useActividadReciente(today, limit)`. Rows are tappable;
 * taps bubble up via onVentaPress / onEgresoPress. Empty state renders
 * a friendly EmptyState for days with no activity yet.
 *
 * Updated: colored circle icons (green $ for ventas, red − for egresos)
 * and semantic Tag variants per the reference design (Image 4).
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

type EntryKind = 'venta' | 'egreso';

const CIRCLE_SYMBOLS: Record<EntryKind, string> = {
  venta: '$',
  egreso: '−', // minus sign
};

/** Colored circle icon — green for ventas, red/pink for egresos. */
function EntryCircle({ kind }: { kind: EntryKind }): ReactElement {
  const isVenta = kind === 'venta';
  return (
    <View
      width={40}
      height={40}
      borderRadius={20}
      backgroundColor={isVenta ? colors.greenSoft : colors.redSoft}
      alignItems="center"
      justifyContent="center"
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={18}
        color={isVenta ? colors.green : colors.red}
      >
        {CIRCLE_SYMBOLS[kind]}
      </Text>
    </View>
  );
}

interface RowBodyProps {
  readonly kind: EntryKind;
  readonly titulo: string;
  readonly tag: string;
  readonly amountText: string;
  readonly amountColor: string;
}

function RowCenter({ titulo, tag, kind }: Pick<RowBodyProps, 'titulo' | 'tag' | 'kind'>): ReactElement {
  return (
    <View flex={1}>
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.bold} fontSize={14} color={colors.black}>
        {titulo}
      </Text>
      <View flexDirection="row" gap={6} marginTop={4}>
        <Tag variant={kind === 'venta' ? 'success' : 'danger'}>{tag}</Tag>
      </View>
    </View>
  );
}

function RowBody(props: RowBodyProps): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={12}>
      <EntryCircle kind={props.kind} />
      <RowCenter titulo={props.titulo} tag={props.tag} kind={props.kind} />
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.black} fontSize={16} color={props.amountColor}>
        {props.amountText}
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
      kind="venta"
      titulo={entry.item.concepto}
      tag={(entry.item as Sale).metodo}
      amountText={`+${formatMoney(entry.item.monto)}`}
      amountColor={colors.green}
    />
  ) : (
    <RowBody
      kind="egreso"
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
