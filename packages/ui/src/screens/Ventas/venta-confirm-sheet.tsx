/**
 * VentaConfirmSheet — tiny bottom-sheet modal for confirming a product sale.
 *
 * ADR-048: the Ventas screen is now an inline POS. Tapping a product card
 * opens this 2–3 field confirmation sheet: quantity + payment method
 * (+ client picker when Crédito). This is a proper Modal — small,
 * dismissible, single decision.
 */

import { useState, useCallback, useEffect, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Client, ClientId, PaymentMethod, Product, ProductId } from '@cachink/domain';
import { formatMoney } from '@cachink/domain';
import { Btn, Combobox, Input, Modal } from '../../components/index';
import { IntegerField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';

const METODOS: readonly PaymentMethod[] = [
  'Efectivo',
  'Transferencia',
  'Tarjeta',
  'QR/CoDi',
  'Crédito',
];

export interface VentaConfirmSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly product: Product | null;
  readonly onSubmit: (data: {
    productoId: ProductId;
    cantidad: number;
    metodo: PaymentMethod;
    clienteId?: ClientId;
  }) => void;
  readonly clientes: readonly Client[];
  readonly submitting?: boolean;
  /** When true, the submit button is disabled (e.g. business not configured). */
  readonly disabled?: boolean;
  /** Shown below the submit button when `disabled` is true. */
  readonly disabledReason?: string;
  /** Mutation error — displayed inline below the submit button. */
  readonly error?: Error | null;
}

function ProductHeader({ product }: { product: Product }): ReactElement {
  return (
    <View flexDirection="row" justifyContent="space-between" alignItems="center">
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.xl}
        color={colors.black}
        flex={1}
        numberOfLines={1}
      >
        {product.nombre}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={fontSizes.xl2}
        color={colors.black}
      >
        {formatMoney(product.precioVentaCentavos)}
      </Text>
    </View>
  );
}

function useSheetForm(productId: string | undefined) {
  const [cantidad, setCantidad] = useState('1');
  const [metodo, setMetodo] = useState<PaymentMethod>('Efectivo');
  const [clienteId, setClienteId] = useState('');
  useEffect(() => {
    setCantidad('1');
    setMetodo('Efectivo');
    setClienteId('');
  }, [productId]);
  return { cantidad, setCantidad, metodo, setMetodo, clienteId, setClienteId };
}

function SheetFields(props: {
  form: ReturnType<typeof useSheetForm>;
  clientes: VentaConfirmSheetProps['clientes'];
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  const { form, t } = props;
  const isCredito = form.metodo === 'Crédito';
  return (
    <>
      <IntegerField
        label={t('ventas.cantidad')}
        value={form.cantidad}
        onChange={form.setCantidad}
        min={1}
        max={9999}
        testID="venta-confirm-cantidad"
      />
      <Input
        type="select"
        label={t('ventas.metodoLabel')}
        value={form.metodo}
        onChange={(v) => form.setMetodo(v as PaymentMethod)}
        options={METODOS as unknown as string[]}
        testID="venta-confirm-metodo"
      />
      {isCredito && (
        <Combobox
          label={t('nuevaVenta.clienteLabel')}
          value={form.clienteId}
          onChange={form.setClienteId}
          options={props.clientes.map((c) => ({ key: c.id, label: c.nombre }))}
          note={t('nuevaVenta.clienteRequired')}
          testID="venta-confirm-cliente"
        />
      )}
    </>
  );
}

function useSheetSubmit(
  product: VentaConfirmSheetProps['product'],
  form: ReturnType<typeof useSheetForm>,
  onSubmit: VentaConfirmSheetProps['onSubmit'],
) {
  return useCallback((): void => {
    if (!product) return;
    const qty = Number.parseInt(form.cantidad, 10);
    if (Number.isNaN(qty) || qty < 1) return;
    onSubmit({
      productoId: product.id,
      cantidad: qty,
      metodo: form.metodo,
      clienteId:
        form.metodo === 'Crédito' && form.clienteId ? (form.clienteId as ClientId) : undefined,
    });
  }, [product, form.cantidad, form.metodo, form.clienteId, onSubmit]);
}

function SheetFooter(props: {
  disabled?: boolean;
  disabledReason?: string;
  error?: Error | null;
}): ReactElement | null {
  if (props.disabled === true && props.disabledReason !== undefined) {
    return (
      <Text
        fontFamily={typography.fontFamily}
        fontSize={fontSizes.xs}
        color={colors.gray600}
        textAlign="center"
        marginTop={4}
      >
        {props.disabledReason}
      </Text>
    );
  }
  if (props.error != null) {
    return (
      <Text
        fontFamily={typography.fontFamily}
        fontSize={fontSizes.xs}
        color={colors.redText}
        textAlign="center"
        marginTop={4}
      >
        {props.error.message}
      </Text>
    );
  }
  return null;
}

function SheetBody(props: Omit<VentaConfirmSheetProps, 'open' | 'onClose'>): ReactElement | null {
  const { product, onSubmit, clientes, submitting, disabled, disabledReason, error } = props;
  const { t } = useTranslation();
  const form = useSheetForm(product?.id);
  const handleSubmit = useSheetSubmit(product, form, onSubmit);
  if (!product) return null;
  return (
    <View gap={16}>
      <ProductHeader product={product} />
      <SheetFields form={form} clientes={clientes} t={t} />
      <Btn
        variant="primary"
        onPress={handleSubmit}
        disabled={disabled === true || (form.metodo === 'Crédito' && !form.clienteId)}
        loading={submitting === true}
        fullWidth
        testID="venta-confirm-submit"
      >
        {t('ventas.registrarVenta')}
      </Btn>
      <SheetFooter disabled={disabled} disabledReason={disabledReason} error={error} />
    </View>
  );
}

export function VentaConfirmSheet(props: VentaConfirmSheetProps): ReactElement {
  const { t } = useTranslation();
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('ventas.confirmTitle')}
      testID="venta-confirm-sheet"
    >
      <SheetBody
        product={props.product}
        onSubmit={props.onSubmit}
        clientes={props.clientes}
        submitting={props.submitting}
        disabled={props.disabled}
        disabledReason={props.disabledReason}
        error={props.error}
      />
    </Modal>
  );
}
