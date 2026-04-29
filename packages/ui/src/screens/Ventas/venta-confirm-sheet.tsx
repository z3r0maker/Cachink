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
import { Btn, Input, Modal } from '../../components/index';
import { IntegerField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

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
}

function SheetBody({
  product,
  onSubmit,
  clientes,
  submitting,
}: Omit<VentaConfirmSheetProps, 'open' | 'onClose'>): ReactElement | null {
  const { t } = useTranslation();
  const [cantidad, setCantidad] = useState('1');
  const [metodo, setMetodo] = useState<PaymentMethod>('Efectivo');
  const [clienteId, setClienteId] = useState('');

  // Reset form state when product changes
  useEffect(() => {
    setCantidad('1');
    setMetodo('Efectivo');
    setClienteId('');
  }, [product?.id]);

  const handleSubmit = useCallback((): void => {
    if (!product) return;
    const qty = Number.parseInt(cantidad, 10);
    if (Number.isNaN(qty) || qty < 1) return;
    onSubmit({
      productoId: product.id,
      cantidad: qty,
      metodo,
      clienteId: metodo === 'Crédito' && clienteId ? (clienteId as ClientId) : undefined,
    });
  }, [product, cantidad, metodo, clienteId, onSubmit]);

  if (!product) return null;

  const isCredito = metodo === 'Crédito';

  return (
    <View gap={16}>
      {/* Product header */}
      <View flexDirection="row" justifyContent="space-between" alignItems="center">
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={18}
          color={colors.black}
          flex={1}
          numberOfLines={1}
        >
          {product.nombre}
        </Text>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={20}
          color={colors.black}
        >
          {formatMoney(product.precioVentaCentavos)}
        </Text>
      </View>

      {/* Quantity */}
      <IntegerField
        label={t('ventas.cantidad')}
        value={cantidad}
        onChange={setCantidad}
        min={1}
        max={9999}
        testID="venta-confirm-cantidad"
      />

      {/* Payment method */}
      <Input
        type="select"
        label={t('ventas.metodoLabel')}
        value={metodo}
        onChange={(v) => setMetodo(v as PaymentMethod)}
        options={METODOS as unknown as string[]}
        testID="venta-confirm-metodo"
      />

      {/* Client picker — only when Crédito */}
      {isCredito && (
        <Input
          type="select"
          label={t('nuevaVenta.clienteLabel')}
          value={clienteId}
          onChange={setClienteId}
          options={clientes.map((c) => c.id)}
          note={t('nuevaVenta.clienteRequired')}
          testID="venta-confirm-cliente"
        />
      )}

      {/* Submit */}
      <Btn
        variant="primary"
        onPress={handleSubmit}
        disabled={submitting || (isCredito && !clienteId)}
        fullWidth
        testID="venta-confirm-submit"
      >
        {t('ventas.registrarVenta')}
      </Btn>
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
      />
    </Modal>
  );
}
