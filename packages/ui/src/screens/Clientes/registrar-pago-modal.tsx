/**
 * RegistrarPagoModal — records a pago against a Crédito venta
 * (Slice 2 C28, M6-T04, ADR-024). Migrated to RHF + zodResolver as
 * part of audit M-1 PR 2.5.
 *
 * Fields: monto (pre-fills with saldo pendiente, formats on blur via
 * `<MoneyField>`), metodo (select: Efectivo / Transferencia / Tarjeta /
 * QR/CoDi), nota (optional). Submit bubbles a NewClientPayment; parent
 * wires `useRegistrarPago` — the use-case owns the state-flip.
 */

import { useEffect, type ReactElement } from 'react';
import type { Control } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { RhfMoneyField, RhfTextField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';

const METODOS: readonly PaymentMethod[] = ['Efectivo', 'Transferencia', 'Tarjeta', 'QR/CoDi'];

/**
 * Form schema. `montoPesos` is the visible string; `<MoneyField>`
 * normalises it to canonical `1234.56` form before this resolver
 * runs. The refine() gates submit on a positive amount without a
 * `Number.isFinite` check scattered across the handler.
 */
const RegistrarPagoFormSchema = z.object({
  montoPesos: z
    .string()
    .min(1)
    .refine((s) => Number.parseFloat(s) > 0, {
      message: 'monto must be positive',
    }),
  metodo: z.enum(['Efectivo', 'Transferencia', 'Tarjeta', 'QR/CoDi']),
  nota: z.string().max(500).or(z.literal('')).optional(),
});

type RegistrarPagoFormValues = z.infer<typeof RegistrarPagoFormSchema>;

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

function defaults(saldo: Money): RegistrarPagoFormValues {
  return {
    montoPesos: (Number(saldo) / 100).toString(),
    metodo: 'Efectivo',
    nota: '',
  };
}

function buildPayload(
  values: RegistrarPagoFormValues,
  venta: Sale,
  businessId: BusinessId,
  fecha: IsoDate,
): NewClientPayment {
  return NewClientPaymentSchema.parse({
    ventaId: venta.id as SaleId,
    fecha,
    montoCentavos: fromPesos(values.montoPesos),
    metodo: values.metodo,
    nota: values.nota?.trim() || undefined,
    businessId,
  });
}

interface PagoFieldsProps {
  readonly control: Control<RegistrarPagoFormValues>;
  readonly t: ReturnType<typeof useTranslation>['t'];
  readonly onSubmitEditing: () => void;
}

function PagoFields({ control, t, onSubmitEditing }: PagoFieldsProps): ReactElement {
  return (
    <>
      <RhfMoneyField
        control={control}
        name="montoPesos"
        label={t('nuevaVenta.montoLabel')}
        errorMessage={t('clientes.required')}
        testID="pago-monto"
        returnKeyType="next"
      />
      <Controller
        name="metodo"
        control={control}
        render={({ field }) => (
          <Input
            type="select"
            label={t('nuevaVenta.metodoLabel')}
            value={field.value}
            onChange={(v) => field.onChange(v)}
            options={METODOS}
            testID="pago-metodo"
          />
        )}
      />
      <RhfTextField
        control={control}
        name="nota"
        label={t('clientes.notaLabel')}
        testID="pago-nota"
        returnKeyType="done"
        onSubmitEditing={onSubmitEditing}
      />
    </>
  );
}

export function RegistrarPagoModal(props: RegistrarPagoModalProps): ReactElement {
  const { t } = useTranslation();
  const form = useForm<RegistrarPagoFormValues>({
    resolver: zodResolver(RegistrarPagoFormSchema),
    defaultValues: defaults(props.saldoPendiente),
    mode: 'onSubmit',
  });
  useEffect(() => {
    form.reset(defaults(props.saldoPendiente));
  }, [props.saldoPendiente, props.venta?.id, form]);
  const submit = form.handleSubmit((values) => {
    if (!props.venta) return;
    props.onSubmit(buildPayload(values, props.venta, props.businessId, props.fecha));
  });
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('nuevaVenta.save')}
      testID="registrar-pago-modal"
    >
      <PagoFields control={form.control} t={t} onSubmitEditing={submit} />
      <Btn
        variant="green"
        onPress={submit}
        disabled={props.submitting === true}
        fullWidth
        testID="pago-submit"
      >
        {t('nuevaVenta.save')}
      </Btn>
    </Modal>
  );
}
