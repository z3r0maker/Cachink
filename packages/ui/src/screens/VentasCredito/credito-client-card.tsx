import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Text, View } from '@tamagui/core';
import { formatMoney, type Sale } from '@cachink/domain';
import { Btn, Card } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';

interface CreditoVentaRowProps {
  readonly venta: Sale;
  readonly onPagar: (v: Sale) => void;
}

function CreditoVentaRow(props: CreditoVentaRowProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      key={props.venta.id}
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      paddingVertical={8}
      paddingLeft={8}
      borderTopWidth={1}
      borderTopColor={colors.gray200}
    >
      <View flex={1} gap={2}>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.medium}
          fontSize={fontSizes.sm}
          color={colors.black}
        >
          {props.venta.concepto}
        </Text>
        <Text fontFamily={typography.fontFamily} fontSize={fontSizes.xs} color={colors.textMuted}>
          {props.venta.fecha} · {formatMoney(props.venta.monto)}
        </Text>
      </View>
      <Btn
        variant="ghost"
        size="sm"
        onPress={() => props.onPagar(props.venta)}
        testID={`pagar-btn-${props.venta.id}`}
      >
        {t('ventasCredito.registrarPago')}
      </Btn>
    </View>
  );
}

export interface CreditoClientRow {
  readonly clienteId: string | null;
  readonly clienteNombre: string;
  readonly totalPendienteCentavos: bigint;
  readonly ventas: readonly Sale[];
}

export interface CreditoClientCardProps {
  readonly row: CreditoClientRow;
  readonly isExpanded: boolean;
  readonly onToggle: () => void;
  readonly onPagar: (v: Sale) => void;
}

export function CreditoClientCard(props: CreditoClientCardProps): ReactElement {
  const key = (props.row.clienteId as string) ?? '__sin-cliente__';
  return (
    <Card key={key} padding="md" fullWidth testID={`credito-client-${key}`}>
      <Pressable onPress={props.onToggle} testID={`credito-toggle-${key}`}>
        <View flexDirection="row" justifyContent="space-between" alignItems="center">
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.bold}
            fontSize={fontSizes.lg}
            color={colors.black}
          >
            {props.row.clienteNombre}
          </Text>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.black}
            fontSize={fontSizes.lg}
            color={colors.redText}
          >
            {formatMoney(props.row.totalPendienteCentavos)}
          </Text>
        </View>
      </Pressable>
      {props.isExpanded &&
        props.row.ventas.map((v) => (
          <CreditoVentaRow key={v.id} venta={v} onPagar={props.onPagar} />
        ))}
    </Card>
  );
}
