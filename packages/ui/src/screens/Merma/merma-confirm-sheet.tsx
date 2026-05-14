/**
 * MermaConfirmSheet — modal for confirming a shrinkage entry.
 *
 * Fields: quantity, reason (select), optional note.
 * Phase 7 of the Feature Flags plan: Merma.
 */

import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Product } from '@cachink/domain';
import { Btn, Input, IntegerField, TextField } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface MermaConfirmSheetProps {
  readonly producto: Product;
  readonly onSubmit: (cantidad: number, reason: string, nota: string | null) => void;
  readonly onCancel: () => void;
  readonly submitting: boolean;
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

const MERMA_REASONS = ['Preparación incorrecta', 'Caducidad', 'Daño', 'Otro'] as const;

interface MermaFormFieldsProps {
  cantidadStr: string;
  setCantidadStr: (v: string) => void;
  reason: string;
  setReason: (v: string) => void;
  nota: string;
  setNota: (v: string) => void;
  t: T;
}

function MermaFormFields(props: MermaFormFieldsProps): ReactElement {
  const { cantidadStr, setCantidadStr, reason, setReason, nota, setNota, t } = props;
  return (
    <>
      <IntegerField
        value={cantidadStr}
        onChange={setCantidadStr}
        label={t('merma.cantidad')}
        min={1}
        testID="merma-cantidad"
      />
      <Input
        label={t('merma.razon')}
        type="select"
        value={reason}
        onChange={setReason}
        options={[...MERMA_REASONS]}
        testID="merma-reason"
      />
      <TextField
        value={nota}
        onChange={setNota}
        label={t('merma.nota')}
        testID="merma-nota"
        placeholder={t('merma.notaHint')}
      />
    </>
  );
}

function MermaActions({
  onCancel,
  onConfirm,
  submitting,
  disabled,
  t,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  submitting: boolean;
  disabled: boolean;
  t: T;
}): ReactElement {
  return (
    <View flexDirection="row" gap={12}>
      <View flex={1}>
        <Btn variant="ghost" onPress={onCancel} fullWidth testID="merma-cancel">
          {t('merma.cancelar')}
        </Btn>
      </View>
      <View flex={1}>
        <Btn
          variant="dark"
          onPress={onConfirm}
          fullWidth
          disabled={submitting || disabled}
          testID="merma-submit"
        >
          {t('merma.confirmar')}
        </Btn>
      </View>
    </View>
  );
}

export function MermaConfirmSheet(props: MermaConfirmSheetProps): ReactElement {
  const { t } = useTranslation();
  const [cantidadStr, setCantidadStr] = useState('1');
  const [reason, setReason] = useState<string>(MERMA_REASONS[0]);
  const [nota, setNota] = useState('');
  const cantidad = Number.parseInt(cantidadStr, 10) || 0;
  return (
    <View testID={props.testID ?? 'merma-confirm-sheet'} padding={16} gap={16}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={20}
        color={colors.black}
      >
        {t('merma.registrar')}
      </Text>
      <Text fontFamily={typography.fontFamily} fontSize={14} color={colors.gray600}>
        {props.producto.nombre}
      </Text>
      <MermaFormFields
        cantidadStr={cantidadStr}
        setCantidadStr={setCantidadStr}
        reason={reason}
        setReason={setReason}
        nota={nota}
        setNota={setNota}
        t={t}
      />
      <MermaActions
        onCancel={props.onCancel}
        onConfirm={() => props.onSubmit(cantidad, reason, nota.length > 0 ? nota : null)}
        submitting={props.submitting}
        disabled={cantidad < 1}
        t={t}
      />
    </View>
  );
}
