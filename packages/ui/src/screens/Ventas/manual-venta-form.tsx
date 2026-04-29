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

export function ManualVentaForm(props: ManualVentaFormProps): ReactElement {
  const { t } = useTranslation();
  const [concepto, setConcepto] = useState('');
  const [montoPesos, setMontoPesos] = useState('');
  const metodo: PaymentMethod = 'Efectivo';

  const valid = concepto.trim().length > 0 && Number(montoPesos) > 0;

  function handleSubmit(): void {
    if (!valid) return;
    props.onSubmit({ concepto: concepto.trim(), montoPesos, metodo });
    setConcepto('');
    setMontoPesos('');
  }

  return (
    <View
      testID={props.testID ?? 'manual-venta-form'}
      flexDirection="row"
      gap={8}
      paddingHorizontal={16}
      alignItems="flex-end"
    >
      <View flex={2}>
        <Input
          label={t('ventas.conceptoLabel')}
          value={concepto}
          onChange={setConcepto}
          placeholder={t('ventas.conceptoPlaceholder')}
          testID="manual-venta-concepto"
        />
      </View>
      <View flex={1}>
        <Input
          label={t('ventas.montoLabel')}
          value={montoPesos}
          onChange={setMontoPesos}
          type="decimal"
          placeholder="0.00"
          testID="manual-venta-monto"
        />
      </View>
      <Btn
        variant="primary"
        onPress={handleSubmit}
        disabled={!valid || props.submitting}
        testID="manual-venta-submit"
      >
        +
      </Btn>
    </View>
  );
}
