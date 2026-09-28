/**
 * «No se pudieron enviar» on Registros por enviar (A-08, formerly its own
 * «No enviados» screen): the records the server refused for good, each with
 * what it is, why, what to do and «Reintentar». No delete: a record stays on
 * the caja until the server accepts it. Refusals still on automatic retry are
 * in «La cola» instead.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { RejectedRow } from '@xangarro/sync';
import { Btn, MText, QuietPanel } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import { describeRejectedRow, type RejectedRowView } from '../SyncRejected/describe-rejected-row';

function Por(p: { v: RejectedRowView }): ReactElement {
  const { t } = useTranslation();
  const tr = (key: string): string => t(key as never);
  return (
    <>
      <MText
        size="sm"
        weight="semibold"
        color={colors.redText}
        testID={`no-enviado-reason-${p.v.key}`}
      >
        {p.v.reasonKey ? tr(p.v.reasonKey) : p.v.fallbackMessage}
      </MText>
      {p.v.hintKey ? (
        <MText size="sm" weight="semibold" color={colors.textMuted}>
          {tr(p.v.hintKey)}
        </MText>
      ) : null}
    </>
  );
}

function Rechazado(p: {
  readonly row: RejectedRow;
  readonly ultima: boolean;
  readonly onRetry: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const v = describeRejectedRow(p.row);
  const tipo = t(v.kindKey as never);
  return (
    <View
      testID={`no-enviado-${v.key}`}
      gap={6}
      paddingHorizontal={14}
      paddingVertical={12}
      borderBottomWidth={p.ultima ? 0 : 1}
      borderBottomColor={colors.gray100}
    >
      <MText size="body" weight="extraBold">
        {v.detail ? `${tipo} · ${v.detail}` : tipo}
      </MText>
      <Por v={v} />
      <View alignSelf="flex-start">
        <Btn
          variant="secondary"
          size="md"
          sentence
          onPress={p.onRetry}
          testID={`no-enviado-retry-${v.key}`}
        >
          {t('noEnviados.retry')}
        </Btn>
      </View>
    </View>
  );
}

function Todos(p: {
  rows: readonly RejectedRow[];
  onRetry: (rows: readonly RejectedRow[]) => void;
}) {
  const { t } = useTranslation();
  if (p.rows.length < 2) return undefined;
  return (
    <Btn
      variant="quiet"
      size="sm"
      sentence
      onPress={() => p.onRetry(p.rows)}
      testID="no-enviados-retry-all"
    >
      {t('noEnviados.retryAll', { count: p.rows.length })}
    </Btn>
  );
}

export function RechazadosLista(p: {
  readonly rows: readonly RejectedRow[];
  readonly onRetry: (rows: readonly RejectedRow[]) => void;
}): ReactElement | null {
  const { t } = useTranslation();
  if (p.rows.length === 0) return null;
  return (
    <QuietPanel
      label="No se pudieron enviar"
      count={p.rows.length}
      action={Todos(p)}
      testID="no-enviados-screen"
    >
      <MText
        size="sm"
        weight="semibold"
        color={colors.textMuted}
        paddingHorizontal={14}
        paddingBottom={4}
      >
        {t('noEnviados.intro')}
      </MText>
      {p.rows.map((r, i) => (
        <Rechazado
          key={`${r.tableName}:${r.rowId}`}
          row={r}
          ultima={i === p.rows.length - 1}
          onRetry={() => p.onRetry([r])}
        />
      ))}
    </QuietPanel>
  );
}
