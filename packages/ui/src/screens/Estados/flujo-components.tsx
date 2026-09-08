/** Shared presentational components for FlujoEfectivoScreen. */

import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { formatMoney, type FlujoDeEfectivo, type Money, ZERO } from '@cachink/domain';
import { Card, DeltaIndicator, HealthIndicator, SectionTitle } from '../../components/index';
import { Icon } from '../../components/Icon/index';
import type { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';
import { moneyToNumber } from '../../charts/chart-tokens';

export type T = ReturnType<typeof useTranslation>['t'];

export function SubRow(props: { label: string; value: Money; testID: string }): ReactElement {
  return (
    <View
      testID={props.testID}
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      paddingVertical={4}
      paddingLeft={16}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={fontSizes.xs}
        color={colors.gray600}
      >
        {props.label}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.sm}
        color={colors.black}
      >
        {formatMoney(props.value)}
      </Text>
    </View>
  );
}

interface CollapsibleHeaderProps {
  label: string;
  total: Money;
  open: boolean;
  onToggle: () => void;
}

function HeaderLabel({ label, open }: { label: string; open: boolean }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={6}>
      <Icon name={open ? 'chevron-down' : 'chevron-right'} size={16} color={colors.gray600} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.md}
        color={colors.ink}
      >
        {label}
      </Text>
    </View>
  );
}

function CollapsibleHeader(p: CollapsibleHeaderProps): ReactElement {
  return (
    <View
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      onPress={p.onToggle}
      cursor="pointer"
    >
      <HeaderLabel label={p.label} open={p.open} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={fontSizes.xl}
        color={p.total >= 0n ? colors.black : colors.redText}
      >
        {formatMoney(p.total)}
      </Text>
    </View>
  );
}

export function CollapsibleSection(props: {
  label: string;
  total: Money;
  children: ReactElement;
  testID: string;
}): ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <Card padding="md" fullWidth testID={props.testID}>
      <CollapsibleHeader
        label={props.label}
        total={props.total}
        open={open}
        onToggle={() => setOpen((p) => !p)}
      />
      {open && <View marginTop={8}>{props.children}</View>}
    </Card>
  );
}

export function ResumenCard({
  flujo,
  prior,
  t,
}: {
  flujo: FlujoDeEfectivo;
  prior?: FlujoDeEfectivo | null;
  t: T;
}): ReactElement {
  const tone = flujo.total >= ZERO ? 'healthy' : 'critical';
  const verdict =
    flujo.total >= ZERO ? t('estados.flujoResumenPositive') : t('estados.flujoResumenNegative');
  return (
    <Card testID="flujo-resumen-card" padding="md" fullWidth>
      <SectionTitle title={t('estados.resultadosResumenTitle')} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={fontSizes.md}
        color={colors.ink}
        marginTop={4}
        marginBottom={8}
      >
        {t('estados.flujoResumenSentence', { total: formatMoney(flujo.total) })}
      </Text>
      <HealthIndicator tone={tone} verdict={verdict} testID="flujo-resumen-health" />
      {prior != null && (
        <DeltaIndicator
          current={moneyToNumber(flujo.total)}
          previous={moneyToNumber(prior.total)}
          format="percent"
          periodLabel={t('estados.deltaVsMesAnterior')}
          testID="flujo-resumen-delta"
        />
      )}
    </Card>
  );
}

export function EmptyCard(props: { title: string; body: string }): ReactElement {
  return (
    <Card testID="flujo-efectivo-empty" padding="md" fullWidth>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.md}
        color={colors.ink}
      >
        {props.title}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={fontSizes.sm}
        color={colors.gray600}
        marginTop={4}
      >
        {props.body}
      </Text>
    </Card>
  );
}
