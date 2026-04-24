/**
 * PendientesCard — Operativo home card showing recurring expense
 * templates whose proximoDisparo is today or earlier (Slice 2 C7,
 * M4-T04).
 *
 * One row per pendiente with Confirmar + Descartar Btns. Pure UI;
 * parent wires confirm → ProcesarGastoRecurrenteUseCase.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { formatMoney } from '@cachink/domain';
import type { RecurringExpense } from '@cachink/domain';
import { Btn, Card, SectionTitle, Tag } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface PendientesCardProps {
  readonly pendientes: readonly RecurringExpense[];
  readonly onConfirmar: (pendiente: RecurringExpense) => void;
  readonly onDescartar?: (pendiente: RecurringExpense) => void;
  readonly confirming?: boolean;
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

function PendienteHeader({ pendiente, t }: { pendiente: RecurringExpense; t: T }): ReactElement {
  return (
    <View flexDirection="row" justifyContent="space-between" alignItems="center">
      <View flex={1} paddingRight={12}>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={15}
          color={colors.black}
        >
          {pendiente.concepto}
        </Text>
        <View flexDirection="row" gap={6} marginTop={4}>
          <Tag>{pendiente.frecuencia}</Tag>
          <Tag variant="warning">{t('pendientes.due')}</Tag>
        </View>
      </View>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={18}
        color={colors.red}
      >
        −{formatMoney(pendiente.montoCentavos)}
      </Text>
    </View>
  );
}

function PendienteActions({
  pendienteId,
  onConfirmar,
  onDescartar,
  confirming,
  t,
}: {
  pendienteId: string;
  onConfirmar: () => void;
  onDescartar?: () => void;
  confirming: boolean;
  t: T;
}): ReactElement {
  return (
    <View flexDirection="row" gap={8} marginTop={10}>
      <Btn
        variant="green"
        size="sm"
        onPress={onConfirmar}
        disabled={confirming}
        testID={`pendiente-confirmar-${pendienteId}`}
      >
        {t('pendientes.confirmar')}
      </Btn>
      {onDescartar && (
        <Btn
          variant="ghost"
          size="sm"
          onPress={onDescartar}
          testID={`pendiente-descartar-${pendienteId}`}
        >
          {t('pendientes.descartar')}
        </Btn>
      )}
    </View>
  );
}

function PendienteRow(props: {
  pendiente: RecurringExpense;
  onConfirmar: () => void;
  onDescartar?: () => void;
  confirming: boolean;
  t: T;
}): ReactElement {
  return (
    <Card testID={`pendiente-${props.pendiente.id}`} padding="md" fullWidth>
      <PendienteHeader pendiente={props.pendiente} t={props.t} />
      <PendienteActions
        pendienteId={props.pendiente.id}
        onConfirmar={props.onConfirmar}
        onDescartar={props.onDescartar}
        confirming={props.confirming}
        t={props.t}
      />
    </Card>
  );
}

export function PendientesCard(props: PendientesCardProps): ReactElement | null {
  const { t } = useTranslation();
  if (props.pendientes.length === 0) return null;
  return (
    <View testID={props.testID ?? 'pendientes-card'} gap={10}>
      <SectionTitle title={t('pendientes.title')} />
      {props.pendientes.map((p) => (
        <PendienteRow
          key={p.id}
          pendiente={p}
          onConfirmar={() => props.onConfirmar(p)}
          onDescartar={props.onDescartar ? () => props.onDescartar?.(p) : undefined}
          confirming={props.confirming === true}
          t={t}
        />
      ))}
    </View>
  );
}
