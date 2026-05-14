/**
 * AbrirCajaModal — cash drawer opening form.
 *
 * Fields: opening amount + optional additional cash.
 * Phase 6 of the Feature Flags plan: Caja.
 */

import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, MoneyField } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import type { Money } from '@cachink/domain';
import { ZERO, toPesosString } from '@cachink/domain';

export interface AbrirCajaModalProps {
  /** Pre-filled from previous turn's cierre amount (handoff). */
  readonly suggestedAmount: Money | null;
  readonly onSubmit: (apertura: Money, adicional: Money) => void;
  readonly submitting: boolean;
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

interface AbrirFieldsProps {
  aperturaStr: string;
  setAperturaStr: (v: string) => void;
  setApertura: (v: Money) => void;
  adicionalStr: string;
  setAdicionalStr: (v: string) => void;
  setAdicional: (v: Money) => void;
  t: T;
}

function AbrirCajaFormFields(p: AbrirFieldsProps): ReactElement {
  return (
    <>
      <MoneyField
        value={p.aperturaStr}
        onChange={p.setAperturaStr}
        onValueChange={(v) => p.setApertura(v ?? ZERO)}
        label={p.t('caja.montoApertura')}
        testID="caja-apertura-monto"
      />
      <MoneyField
        value={p.adicionalStr}
        onChange={p.setAdicionalStr}
        onValueChange={(v) => p.setAdicional(v ?? ZERO)}
        label={p.t('caja.efectivoAdicional')}
        testID="caja-adicional-monto"
      />
    </>
  );
}

export function AbrirCajaModal(props: AbrirCajaModalProps): ReactElement {
  const { t } = useTranslation();
  const initial = props.suggestedAmount ? toPesosString(props.suggestedAmount) : '';
  const [aperturaStr, setAperturaStr] = useState(initial);
  const [adicionalStr, setAdicionalStr] = useState('');
  const [apertura, setApertura] = useState<Money>(props.suggestedAmount ?? ZERO);
  const [adicional, setAdicional] = useState<Money>(ZERO);
  return (
    <View testID={props.testID ?? 'abrir-caja-modal'} padding={16} gap={16}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={24}
        color={colors.black}
      >
        {t('caja.abrirTitle')}
      </Text>
      <AbrirCajaFormFields
        aperturaStr={aperturaStr}
        setAperturaStr={setAperturaStr}
        setApertura={setApertura}
        adicionalStr={adicionalStr}
        setAdicionalStr={setAdicionalStr}
        setAdicional={setAdicional}
        t={t}
      />
      <Btn
        variant="dark"
        onPress={() => props.onSubmit(apertura, adicional)}
        fullWidth
        disabled={props.submitting}
        testID="caja-abrir-submit"
      >
        {t('caja.abrirSubmit')}
      </Btn>
    </View>
  );
}
