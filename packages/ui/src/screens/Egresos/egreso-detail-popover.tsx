/**
 * EgresoDetailPopover — opens when a user taps an EgresoCard
 * (Slice 2 C9). Shows the egreso's detail + an "Eliminar" action
 * (soft-delete via useEliminarEgreso). No share action — egresos
 * don't have comprobantes.
 *
 * Pure UI: callbacks wired by the parent route.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Expense } from '@cachink/domain';
import { formatMoney } from '@cachink/domain';
import { Btn, Modal, Tag } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface EgresoDetailPopoverProps {
  readonly open: boolean;
  readonly egreso: Expense | null;
  readonly onClose: () => void;
  readonly onDelete: () => void;
  readonly deleting?: boolean;
}

function DetailBody({ egreso }: { egreso: Expense }): ReactElement {
  return (
    <View gap={10}>
      <View flexDirection="row" gap={6}>
        <Tag>{egreso.categoria}</Tag>
        {egreso.proveedor !== null && <Tag variant="neutral">{egreso.proveedor}</Tag>}
      </View>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={32}
        color={colors.red}
        letterSpacing={typography.letterSpacing.tighter}
      >
        −{formatMoney(egreso.monto)}
      </Text>
    </View>
  );
}

export function EgresoDetailPopover(props: EgresoDetailPopoverProps): ReactElement | null {
  const { t } = useTranslation();
  if (!props.egreso) return null;
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={props.egreso.concepto}
      testID="egreso-detail-popover"
    >
      <DetailBody egreso={props.egreso} />
      <View marginTop={16} gap={8}>
        <Btn
          variant="danger"
          onPress={props.onDelete}
          disabled={props.deleting === true}
          fullWidth
          testID="egreso-detail-delete"
        >
          {t('egresos.delete')}
        </Btn>
      </View>
    </Modal>
  );
}
