/**
 * RegistrarPagoModal — records a pago against a Crédito venta
 * (Slice 2 C28, M6-T04, ADR-024).
 *
 * Fields: monto (pre-fills with saldo pendiente), metodo (select:
 * Efectivo/Transferencia/Tarjeta/QR/CoDi), fecha (today), nota
 * (optional). Submit bubbles a NewClientPayment; parent wires
 * `useRegistrarPago` — the use-case owns the state-flip.
 */

import { useState, type ReactElement } from 'react';
import {
  NewClientPaymentSchema,
  fromPesos,
  type BusinessId,
  type IsoDate,
  type Money,
  type NewClientPayment,
  type PaymentMethod,
  type Sale,
  type SaleId,
} from '@cachink/domain';
import { Btn, Input, Modal } from '../../components/index';
import { useTranslation } from '../../i18n/index';

const METODOS: readonly PaymentMethod[] = [
  'Efectivo',
  'Transferencia',
  'Tarjeta',
  'QR/CoDi',
  'Crédito',
];

export interface RegistrarPagoModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: NewClientPayment) => void;
  readonly venta: Sale | null;
  readonly saldoPendiente: Money;
  readonly businessId: BusinessId;
  readonly fecha: IsoDate;
  readonly submitting?: boolean;
}

interface FormState {
  montoPesos: string;
  metodo: PaymentMethod;
  nota: string;
}

function initialState(saldo: Money): FormState {
  return {
    montoPesos: (Number(saldo) / 100).toString(),
    metodo: 'Efectivo',
    nota: '',
  };
}

function PagoFields({
  state,
  update,
  error,
  t,
}: {
  state: FormState;
  update: (p: Partial<FormState>) => void;
  error: string | undefined;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <>
      <Input
        type="number"
        label={t('nuevaVenta.montoLabel')}
        value={state.montoPesos}
        onChange={(v) => update({ montoPesos: v })}
        note={error}
        testID="pago-monto"
      />
      <Input
        type="select"
        label={t('nuevaVenta.metodoLabel')}
        value={state.metodo}
        onChange={(v) => update({ metodo: v as PaymentMethod })}
        options={METODOS.filter((m) => m !== 'Crédito')}
        testID="pago-metodo"
      />
      <Input
        label={t('clientes.notaLabel')}
        value={state.nota}
        onChange={(v) => update({ nota: v })}
        testID="pago-nota"
      />
    </>
  );
}

function buildPayload(
  state: FormState,
  venta: Sale,
  businessId: BusinessId,
  fecha: IsoDate,
): NewClientPayment {
  return NewClientPaymentSchema.parse({
    ventaId: venta.id as SaleId,
    fecha,
    montoCentavos: fromPesos(state.montoPesos),
    metodo: state.metodo,
    nota: state.nota.trim() || undefined,
    businessId,
  });
}

export function RegistrarPagoModal(props: RegistrarPagoModalProps): ReactElement {
  const { t } = useTranslation();
  const [state, setState] = useState<FormState>(() => initialState(props.saldoPendiente));
  const [error, setError] = useState<string | undefined>();
  const update = (p: Partial<FormState>): void => setState((prev) => ({ ...prev, ...p }));

  const handleSubmit = (): void => {
    if (!props.venta) return;
    const monto = Number(state.montoPesos);
    if (!Number.isFinite(monto) || monto <= 0) {
      setError(t('clientes.required'));
      return;
    }
    setError(undefined);
    props.onSubmit(buildPayload(state, props.venta, props.businessId, props.fecha));
  };

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('nuevaVenta.save')}
      testID="registrar-pago-modal"
    >
      <PagoFields state={state} update={update} error={error} t={t} />
      <Btn
        variant="green"
        onPress={handleSubmit}
        disabled={props.submitting === true}
        fullWidth
        testID="pago-submit"
      >
        {t('nuevaVenta.save')}
      </Btn>
    </Modal>
  );
}
