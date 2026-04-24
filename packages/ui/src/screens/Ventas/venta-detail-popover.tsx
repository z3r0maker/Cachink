/**
 * VentaDetailPopover — opens when a user taps a VentaCard
 * (P1C C15 polish). Shows the venta's detail + two actions:
 * "Compartir comprobante" (opens the ComprobantePreview) and
 * "Eliminar" (soft-delete via useEliminarVenta).
 *
 * Pure UI: both actions are callbacks wired by the parent route.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Sale } from '@cachink/domain';
import { formatMoney } from '@cachink/domain';
import { Btn, Modal, Tag } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface VentaDetailPopoverProps {
  readonly open: boolean;
  readonly venta: Sale | null;
  readonly onClose: () => void;
  readonly onShare: () => void;
  readonly onDelete: () => void;
  readonly deleting?: boolean;
}

function DetailBody({ venta }: { venta: Sale }): ReactElement {
  return (
    <View gap={10}>
      <View flexDirection="row" gap={6}>
        <Tag>{venta.categoria}</Tag>
        <Tag variant={venta.metodo === 'Crédito' ? 'warning' : 'neutral'}>{venta.metodo}</Tag>
      </View>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={32}
        color={colors.black}
        letterSpacing={typography.letterSpacing.tighter}
      >
        {formatMoney(venta.monto)}
      </Text>
    </View>
  );
}

export function VentaDetailPopover(props: VentaDetailPopoverProps): ReactElement | null {
  const { t } = useTranslation();
  if (!props.venta) return null;
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={props.venta.concepto}
      testID="venta-detail-popover"
    >
      <DetailBody venta={props.venta} />
      <View marginTop={16} gap={8}>
        <Btn variant="primary" onPress={props.onShare} fullWidth testID="venta-detail-share">
          {t('ventas.share')}
        </Btn>
        <Btn
          variant="danger"
          onPress={props.onDelete}
          disabled={props.deleting === true}
          fullWidth
          testID="venta-detail-delete"
        >
          {t('ventas.delete')}
        </Btn>
      </View>
    </Modal>
  );
}
