/**
 * CountResultStep — Step 2 of the tamper-proof blind-close flow.
 *
 * Shows the locked count vs expected balance comparison, a discrepancy
 * reason selector, optional note, and the "CERRAR TURNO" button.
 *
 * Caja Overhaul — Phase C.
 */

import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { DiscrepancyReason, Money } from '@cachink/domain';
import { formatMoney, ZERO } from '@cachink/domain';
import { Btn } from '../../components/Btn/btn';
import { Card } from '../../components/Card/card';
import { Icon } from '../../components/Icon/index';
import { Input } from '../../components/Input/input';
import { TextField } from '../../components/fields/text-field';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface CountResultStepProps {
  readonly conteoCentavos: Money;
  readonly esperadoCentavos: Money;
  readonly onClose: (
    reason: DiscrepancyReason | null,
    explicacion: string | null,
  ) => void;
  readonly submitting: boolean;
  readonly testID?: string;
}

const REASONS: readonly DiscrepancyReason[] = [
  'gasto-no-registrado',
  'error-en-cambio',
  'retiro-autorizado',
  'faltante-sin-explicacion',
  'sobrante',
  'otro',
];

export function CountResultStep(props: CountResultStepProps): ReactElement {
  const { t } = useTranslation();
  const diff = props.conteoCentavos - props.esperadoCentavos;
  const hasDiff = diff !== ZERO;
  const [reason, setReason] = useState<DiscrepancyReason | null>(null);
  const [explicacion, setExplicacion] = useState('');
  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
      testID={props.testID ?? 'count-result-step'}
      keyboardShouldPersistTaps="handled"
    >
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.black}
        fontSize={22} color={colors.black}>
        {t('caja.countResultTitle')}
      </Text>
      <ComparisonCard conteo={props.conteoCentavos} esperado={props.esperadoCentavos}
        diff={diff} />
      {hasDiff && (
        <ReasonSelector reason={reason} setReason={setReason}
          explicacion={explicacion} setExplicacion={setExplicacion} />
      )}
      <Btn variant="dark"
        onPress={() => props.onClose(reason, explicacion.length > 0 ? explicacion : null)}
        fullWidth loading={props.submitting} disabled={hasDiff && !reason}
        testID="count-result-close">
        {t('caja.cerrarSubmit')}
      </Btn>
    </ScrollView>
  );
}

// --- Sub-components ---

function ComparisonRow(props: { label: string; value: string }): ReactElement {
  return (
    <View flexDirection="row" justifyContent="space-between">
      <Text fontFamily={typography.fontFamily} fontSize={14} color={colors.gray600}>
        {props.label}
      </Text>
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.bold}
        fontSize={16} color={colors.black}>
        {props.value}
      </Text>
    </View>
  );
}

function ComparisonCard(props: {
  conteo: Money;
  esperado: Money;
  diff: Money;
}): ReactElement {
  const { t } = useTranslation();
  const isNeg = props.diff < 0n;
  const diffColor = props.diff === ZERO ? colors.green : isNeg ? colors.red : colors.yellow;
  return (
    <Card variant="white" padding="md" fullWidth testID="comparison-card">
      <View gap={8}>
        <ComparisonRow label={t('caja.countResultContaste')} value={formatMoney(props.conteo)} />
        <ComparisonRow label={t('caja.countResultEsperado')} value={formatMoney(props.esperado)} />
        <View height={1} backgroundColor={colors.gray200} />
        <View flexDirection="row" justifyContent="space-between" alignItems="center">
          <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.bold}
            fontSize={16} color={diffColor}>
            {t('caja.countResultDiff')}
          </Text>
          <View flexDirection="row" alignItems="center" gap={4}>
            <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.black}
              fontSize={18} color={diffColor}>
              {formatMoney(props.diff)}
            </Text>
            {props.diff !== ZERO && <Icon name="triangle-alert" size={16} color={diffColor} />}
          </View>
        </View>
      </View>
    </Card>
  );
}

function ReasonSelector(props: {
  reason: DiscrepancyReason | null;
  setReason: (v: DiscrepancyReason | null) => void;
  explicacion: string;
  setExplicacion: (v: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <View gap={12}>
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.bold}
        fontSize={16} color={colors.black}>
        {t('caja.countResultWhyLabel')}
      </Text>
      <Input
        label={String(t('caja.razon'))}
        type="select"
        value={props.reason ?? ''}
        onChange={(v) => props.setReason((v || null) as DiscrepancyReason | null)}
        options={REASONS as unknown as readonly string[]}
        testID="count-result-reason"
      />
      <TextField
        value={props.explicacion}
        onChange={props.setExplicacion}
        label={String(t('caja.explicacion'))}
        testID="count-result-explicacion"
        placeholder={String(t('caja.explicacionHint'))}
      />
    </View>
  );
}
