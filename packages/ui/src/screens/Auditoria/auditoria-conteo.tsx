/**
 * AuditoriaConteo — counting UI for an active inventory audit.
 * Shows product list with stockSistema and editable stockReal,
 * a running counter, and a "Finalizar" button.
 */

import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { AuditoriaInventario, AuditoriaLinea } from '@cachink/domain';
import { Btn, ConfirmDialog } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { useActualizarAuditoria } from '../../hooks/use-actualizar-auditoria';
import { colors, typography } from '../../theme';
import { ConteoLineaCard } from './conteo-linea-card';

export interface AuditoriaConteoProps {
  readonly auditoria: AuditoriaInventario;
  readonly onFinalized: () => void;
  readonly onCancelled: () => void;
  readonly testID?: string;
}

export function AuditoriaConteo(props: AuditoriaConteoProps): ReactElement {
  const { t } = useTranslation();
  const { mutateAsync, isPending } = useActualizarAuditoria();

  const [lineas, setLineas] = useState<AuditoriaLinea[]>(
    () => JSON.parse(props.auditoria.lineas) as AuditoriaLinea[],
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const contados = lineas.filter((l) => l.stockReal !== null).length;
  const total = lineas.length;
  const allCounted = contados === total;

  const discrepancias = lineas.filter(
    (l) => l.diferencia !== null && l.diferencia !== 0,
  ).length;

  const handleStockChange = (idx: number, value: string): void => {
    const parsed = value.trim() === '' ? null : Number(value);
    const stockReal =
      parsed !== null && Number.isInteger(parsed) ? parsed : null;
    setLineas((prev) => {
      const next = [...prev];
      const linea = next[idx];
      if (!linea) return prev;
      const diferencia =
        stockReal !== null ? stockReal - linea.stockSistema : null;
      next[idx] = { ...linea, stockReal, diferencia };
      return next;
    });
  };

  const handleSave = async (): Promise<void> => {
    await mutateAsync({
      id: props.auditoria.id,
      lineas,
      estado: 'borrador',
    });
  };

  const handleFinalize = async (): Promise<void> => {
    await mutateAsync({
      id: props.auditoria.id,
      lineas,
      estado: 'finalizada',
    });
    setShowConfirm(false);
    props.onFinalized();
  };

  const handleCancel = async (): Promise<void> => {
    await mutateAsync({
      id: props.auditoria.id,
      lineas,
      estado: 'cancelada',
    });
    setShowCancel(false);
    props.onCancelled();
  };

  return (
    <View gap={12} testID={props.testID ?? 'auditoria-conteo'}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={14}
        color={colors.gray600}
        testID="conteo-counter"
      >
        {t('auditoria.contados', {
          contados: String(contados),
          total: String(total),
        })}
      </Text>

      <ScrollView>
        <View gap={8}>
          {lineas.map((linea, idx) => (
            <ConteoLineaCard
              key={linea.productoId as string}
              linea={linea}
              onChange={(v) => handleStockChange(idx, v)}
            />
          ))}
        </View>
      </ScrollView>

      <View flexDirection="row" gap={8}>
        <View flex={1}>
          <Btn
            variant="ghost"
            onPress={() => setShowCancel(true)}
            disabled={isPending}
            fullWidth
            testID="conteo-cancelar"
          >
            {t('auditoria.cancelar')}
          </Btn>
        </View>
        <View flex={1}>
          <Btn
            variant="ghost"
            onPress={handleSave}
            disabled={isPending}
            fullWidth
            testID="conteo-save"
          >
            {t('actions.save')}
          </Btn>
        </View>
        <View flex={1}>
          <Btn
            onPress={() => setShowConfirm(true)}
            disabled={!allCounted || isPending}
            fullWidth
            testID="conteo-finalizar"
          >
            {t('auditoria.finalizar')}
          </Btn>
        </View>
      </View>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title={t('auditoria.confirmarFinalizar')}
        description={t('auditoria.confirmarFinalizarDesc', {
          count: discrepancias,
        })}
        onConfirm={handleFinalize}
        confirmLabel={t('auditoria.finalizar')}
        tone="default"
      />
      <ConfirmDialog
        open={showCancel}
        onClose={() => setShowCancel(false)}
        title={t('auditoria.cancelar')}
        description={t('auditoria.cancelarConfirm')}
        onConfirm={handleCancel}
        confirmLabel={t('auditoria.cancelar')}
        tone="danger"
      />
    </View>
  );
}
