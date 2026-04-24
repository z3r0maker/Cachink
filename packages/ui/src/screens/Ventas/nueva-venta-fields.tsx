/**
 * Field subcomponents for NuevaVentaModal. Split out to keep the modal
 * file under the 200-line ceiling (CLAUDE.md §4.4).
 */

import type { ReactElement } from 'react';
import type { Client, PaymentMethod, SaleCategory } from '@cachink/domain';
import { Btn, Input } from '../../components/index';
import type { useTranslation } from '../../i18n/index';
import type { FormErrors, FormState } from './nueva-venta-form';
import { CATEGORIAS, METODOS } from './nueva-venta-form';

type T = ReturnType<typeof useTranslation>['t'];

export interface FieldsProps {
  readonly state: FormState;
  readonly update: (partial: Partial<FormState>) => void;
  readonly errors: FormErrors;
  readonly clientes: readonly Client[];
  readonly onCrearCliente?: () => void;
  readonly t: T;
}

export function ClienteField(props: FieldsProps): ReactElement {
  const { state, update, errors, clientes, t } = props;
  const isCredito = state.metodo === 'Crédito';
  const requiredSuffix = isCredito ? ' *' : '';
  const note =
    errors.cliente ??
    (isCredito ? t('nuevaVenta.clienteRequired') : t('nuevaVenta.clienteOpcional'));
  if (isCredito && clientes.length === 0 && props.onCrearCliente) {
    return (
      <Btn
        variant="soft"
        onPress={props.onCrearCliente}
        fullWidth
        testID="nueva-venta-crear-cliente"
      >
        {t('nuevaVenta.crearCliente')}
      </Btn>
    );
  }
  return (
    <Input
      type="select"
      label={`${t('nuevaVenta.clienteLabel')}${requiredSuffix}`}
      value={state.clienteId}
      onChange={(value) => update({ clienteId: value })}
      options={clientes.map((c) => c.id)}
      note={note}
      testID="nueva-venta-cliente"
    />
  );
}

export function CoreFields(props: FieldsProps): ReactElement {
  const { state, update, errors, t } = props;
  return (
    <>
      <Input
        label={t('nuevaVenta.conceptoLabel')}
        placeholder={t('nuevaVenta.conceptoPlaceholder')}
        value={state.concepto}
        onChange={(value) => update({ concepto: value })}
        note={errors.concepto}
        testID="nueva-venta-concepto"
      />
      <Input
        type="select"
        label={t('nuevaVenta.categoriaLabel')}
        value={state.categoria}
        onChange={(value) => update({ categoria: value as SaleCategory })}
        options={CATEGORIAS}
        testID="nueva-venta-categoria"
      />
      <Input
        type="number"
        label={t('nuevaVenta.montoLabel')}
        value={state.montoPesos}
        onChange={(value) => update({ montoPesos: value })}
        note={errors.monto}
        testID="nueva-venta-monto"
      />
      <Input
        type="select"
        label={t('nuevaVenta.metodoLabel')}
        value={state.metodo}
        onChange={(value) => update({ metodo: value as PaymentMethod })}
        options={METODOS}
        testID="nueva-venta-metodo"
      />
    </>
  );
}
