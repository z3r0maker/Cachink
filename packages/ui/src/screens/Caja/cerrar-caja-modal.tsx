/**
 * CerrarCajaModal — cash drawer closing form.
 *
 * Fields: counted cash, discrepancy reason (select), explanation.
 * Phase 6 of the Feature Flags plan: Caja.
 */

import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { DiscrepancyReason, Money } from '@cachink/domain';
import { ZERO } from '@cachink/domain';
import { Btn, MoneyField, TextField } from '../../components/index';
import { Input } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface CerrarCajaModalProps {
  readonly onSubmit: (
    montoCierre: Money,
    reason: DiscrepancyReason | null,
    explicacion: string | null,
  ) => void;
  readonly submitting: boolean;
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

const REASONS: readonly DiscrepancyReason[] = [
  'gasto-no-registrado',
  'error-en-cambio',
  'retiro-autorizado',
  'faltante-sin-explicacion',
  'sobrante',
  'otro',
];

interface CerrarFieldsProps {
  montoStr: string;
  setMontoStr: (v: string) => void;
  setMonto: (v: Money) => void;
  reason: DiscrepancyReason | null;
  setReason: (v: DiscrepancyReason | null) => void;
  explicacion: string;
  setExplicacion: (v: string) => void;
  t: T;
}

function CerrarCajaFormFields(p: CerrarFieldsProps): ReactElement {
  return (
    <>
      <MoneyField
        value={p.montoStr}
        onChange={p.setMontoStr}
        onValueChange={(v) => p.setMonto(v ?? ZERO)}
        label={p.t('caja.montoCierre')}
        testID="caja-cierre-monto"
      />
      <Input
        label={p.t('caja.razon')}
        type="select"
        value={p.reason ?? ''}
        onChange={(v) => p.setReason((v || null) as DiscrepancyReason | null)}
        options={REASONS as unknown as readonly string[]}
        testID="caja-reason"
      />
      <TextField
        value={p.explicacion}
        onChange={p.setExplicacion}
        label={p.t('caja.explicacion')}
        testID="caja-explicacion"
        placeholder={p.t('caja.explicacionHint')}
      />
    </>
  );
}

export function CerrarCajaModal(props: CerrarCajaModalProps): ReactElement {
  const { t } = useTranslation();
  const [montoStr, setMontoStr] = useState('');
  const [monto, setMonto] = useState<Money>(ZERO);
  const [reason, setReason] = useState<DiscrepancyReason | null>(null);
  const [explicacion, setExplicacion] = useState('');
  const handleSubmit = (): void => {
    props.onSubmit(monto, reason, explicacion.length > 0 ? explicacion : null);
  };
  return (
    <View testID={props.testID ?? 'cerrar-caja-modal'} padding={16} gap={16}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={24}
        color={colors.black}
      >
        {t('caja.cerrarTitle')}
      </Text>
      <CerrarCajaFormFields
        montoStr={montoStr}
        setMontoStr={setMontoStr}
        setMonto={setMonto}
        reason={reason}
        setReason={setReason}
        explicacion={explicacion}
        setExplicacion={setExplicacion}
        t={t}
      />
      <Btn
        variant="dark"
        onPress={handleSubmit}
        fullWidth
        disabled={props.submitting}
        testID="caja-cerrar-submit"
      >
        {t('caja.cerrarSubmit')}
      </Btn>
    </View>
  );
}
