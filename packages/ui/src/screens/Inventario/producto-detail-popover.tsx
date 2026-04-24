/**
 * ProductoDetailPopover — opens when a user taps a ProductoCard
 * (Slice 2 C22). Shows the producto detail + entrada / salida /
 * eliminar actions.
 *
 * Pure UI: callbacks wired by the parent route.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Product } from '@cachink/domain';
import { formatMoney } from '@cachink/domain';
import { Btn, Modal, Tag } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface ProductoDetailPopoverProps {
  readonly open: boolean;
  readonly producto: Product | null;
  readonly stock: number;
  readonly onClose: () => void;
  readonly onEntrada: () => void;
  readonly onSalida: () => void;
  readonly onDelete: () => void;
  readonly deleting?: boolean;
}

function DetailBody({ producto, stock }: { producto: Product; stock: number }): ReactElement {
  const isLow = stock <= producto.umbralStockBajo;
  return (
    <View gap={10}>
      <View flexDirection="row" gap={6}>
        <Tag>{producto.categoria}</Tag>
        <Tag variant="neutral">{producto.unidad}</Tag>
      </View>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={32}
        color={isLow ? colors.red : colors.black}
        letterSpacing={typography.letterSpacing.tighter}
      >
        {stock}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={13}
        color={colors.gray600}
      >
        {formatMoney(producto.costoUnitCentavos)}
      </Text>
    </View>
  );
}

function ActionStack({
  onEntrada,
  onSalida,
  onDelete,
  deleting,
  t,
}: {
  onEntrada: () => void;
  onSalida: () => void;
  onDelete: () => void;
  deleting: boolean;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <View marginTop={16} gap={8}>
      <Btn variant="green" onPress={onEntrada} fullWidth testID="producto-detail-entrada">
        {t('inventario.entrada')}
      </Btn>
      <Btn variant="primary" onPress={onSalida} fullWidth testID="producto-detail-salida">
        {t('inventario.salida')}
      </Btn>
      <Btn
        variant="danger"
        onPress={onDelete}
        disabled={deleting}
        fullWidth
        testID="producto-detail-delete"
      >
        {t('inventario.delete')}
      </Btn>
    </View>
  );
}

export function ProductoDetailPopover(props: ProductoDetailPopoverProps): ReactElement | null {
  const { t } = useTranslation();
  if (!props.producto) return null;
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={props.producto.nombre}
      testID="producto-detail-popover"
    >
      <DetailBody producto={props.producto} stock={props.stock} />
      <ActionStack
        onEntrada={props.onEntrada}
        onSalida={props.onSalida}
        onDelete={props.onDelete}
        deleting={props.deleting === true}
        t={t}
      />
    </Modal>
  );
}
