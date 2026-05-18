/**
 * ManualVentaForm — compact inline 3-field form for free-text ventas.
 *
 * Fields: concepto, monto, payment method. Submit creates a venta
 * without a productoId. For full-featured sales (Anticipo, Suscripción,
 * Crédito) users tap "Venta avanzada" which opens the full modal.
 */

import { useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { PaymentMethod } from '@cachink/domain';
import { Btn, Input } from '../../components/index';
import { useTranslation } from '../../i18n/index';

export interface ManualVentaFormProps {
  readonly onSubmit: (data: ManualVentaData) => void;
  readonly onAdvanced?: () => void;
  readonly submitting?: boolean;
  readonly testID?: string;
}

export interface ManualVentaData {
  readonly concepto: string;
  readonly montoPesos: string;
  readonly metodo: PaymentMethod;
}

function useManualVentaState(onSubmit: ManualVentaFormProps['onSubmit']) {
  const [concepto, setConcepto] = useState('');
  const [montoPesos, setMontoPesos] = useState('');
  const valid = concepto.trim().length > 0 && Number(montoPesos) > 0;
  const submit = (): void => {
    if (!valid) return;
    onSubmit({ concepto: concepto.trim(), montoPesos, metodo: 'Efectivo' });
    setConcepto('');
    setMontoPesos('');
  };
  return { concepto, setConcepto, montoPesos, setMontoPesos, valid, submit };
}

function FormFields(props: {
  concepto: string;
  montoPesos: string;
  setConcepto: (v: string) => void;
  setMontoPesos: (v: string) => void;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <>
      <View flex={2}>
        <Input
          label={props.t('ventas.conceptoLabel')}
          value={props.concepto}
          onChange={props.setConcepto}
          placeholder={props.t('ventas.conceptoPlaceholder')}
          testID="manual-venta-concepto"
        />
      </View>
      <View flex={1}>
        <Input
          label={props.t('ventas.montoLabel')}
          value={props.montoPesos}
          onChange={props.setMontoPesos}
          type="decimal"
          placeholder="0.00"
          testID="manual-venta-monto"
        />
      </View>
    </>
  );
}

export function ManualVentaForm(props: ManualVentaFormProps): ReactElement {
  const { t } = useTranslation();
  const f = useManualVentaState(props.onSubmit);
  return (
    <View
      testID={props.testID ?? 'manual-venta-form'}
      flexDirection="row"
      gap={8}
      paddingHorizontal={16}
      alignItems="flex-end"
    >
      <FormFields
        concepto={f.concepto}
        montoPesos={f.montoPesos}
        setConcepto={f.setConcepto}
        setMontoPesos={f.setMontoPesos}
        t={t}
      />
      <Btn
        variant="primary"
        onPress={f.submit}
        disabled={!f.valid}
        loading={props.submitting === true}
        testID="manual-venta-submit"
      >
        +
      </Btn>
    </View>
  );
}
