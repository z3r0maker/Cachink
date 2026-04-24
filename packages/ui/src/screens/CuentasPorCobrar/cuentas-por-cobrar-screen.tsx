/**
 * CuentasPorCobrarScreen — full view upgrading the M3 strip
 * (Slice 2 C30, M6-T03).
 *
 * Adds:
 *   - 'Días promedio de cobranza' KPI card.
 *   - Sort toggle (oldest first / newest first).
 *   - Renders the existing CuentasPorCobrarStrip below.
 */

import { useMemo, useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { IsoDate, Sale } from '@cachink/domain';
import { Card, Kpi, SectionTitle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, radii, typography } from '../../theme';
import { CuentasPorCobrarStrip, type CuentaPorCobrarRow } from './cuentas-por-cobrar-strip';
import { diasPromedioCobranza } from './cuentas-por-cobrar-kpis';

export type CxcSort = 'oldest-first' | 'newest-first';

export interface CuentasPorCobrarScreenProps {
  readonly rows: readonly CuentaPorCobrarRow[];
  readonly today: IsoDate;
  readonly initialSort?: CxcSort;
  readonly testID?: string;
}

function allPendingSales(rows: readonly CuentaPorCobrarRow[]): readonly Sale[] {
  return rows.flatMap((row) => row.ventas);
}

function sortRows(
  rows: readonly CuentaPorCobrarRow[],
  sort: CxcSort,
): readonly CuentaPorCobrarRow[] {
  const withOldest = rows.map((row) => {
    const oldest = row.ventas.reduce(
      (acc, v) => (v.fecha < acc ? v.fecha : acc),
      row.ventas[0]?.fecha ?? '',
    );
    return { row, oldest };
  });
  withOldest.sort((a, b) => (a.oldest < b.oldest ? -1 : 1));
  if (sort === 'newest-first') withOldest.reverse();
  return withOldest.map((w) => w.row);
}

function SortToggle({
  sort,
  onChange,
}: {
  sort: CxcSort;
  onChange: (next: CxcSort) => void;
}): ReactElement {
  const options: readonly CxcSort[] = ['oldest-first', 'newest-first'];
  return (
    <View flexDirection="row" gap={8}>
      {options.map((opt) => (
        <View
          key={opt}
          testID={`cxc-sort-${opt}`}
          onPress={() => onChange(opt)}
          backgroundColor={sort === opt ? colors.yellow : colors.white}
          borderColor={colors.black}
          borderWidth={2}
          borderRadius={radii[1]}
          paddingHorizontal={10}
          paddingVertical={6}
          cursor="pointer"
        >
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.bold}
            fontSize={11}
            color={colors.black}
            letterSpacing={typography.letterSpacing.wide}
            style={{ textTransform: 'uppercase', userSelect: 'none' }}
          >
            {opt === 'oldest-first' ? '↑ Antiguas' : '↓ Recientes'}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function CuentasPorCobrarScreen(props: CuentasPorCobrarScreenProps): ReactElement {
  const { t } = useTranslation();
  const [sort, setSort] = useState<CxcSort>(props.initialSort ?? 'oldest-first');
  const sorted = useMemo(() => sortRows(props.rows, sort), [props.rows, sort]);
  const avgDays = useMemo(
    () => diasPromedioCobranza(allPendingSales(props.rows), props.today),
    [props.rows, props.today],
  );

  return (
    <View
      testID={props.testID ?? 'cuentas-por-cobrar-screen'}
      flex={1}
      backgroundColor={colors.offwhite}
    >
      <View padding={16} gap={12}>
        <SectionTitle
          title={t('cuentasPorCobrar.title')}
          action={<SortToggle sort={sort} onChange={setSort} />}
        />
        <Card padding="md" fullWidth testID="cxc-avg-days">
          <Kpi
            label="Días promedio"
            value={String(avgDays)}
            tone={avgDays > 30 ? 'negative' : 'neutral'}
          />
        </Card>
      </View>
      <CuentasPorCobrarStrip rows={sorted} />
    </View>
  );
}
