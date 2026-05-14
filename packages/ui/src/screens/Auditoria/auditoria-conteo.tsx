/**
 * AuditoriaConteo — counting UI for an active inventory audit.
 * Shows product list with stockSistema and editable stockReal,
 * a running counter, and a "Finalizar" button.
 */

import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { AuditoriaInventario, AuditoriaLinea } from '@cachink/domain';
import { Btn, Card, ConfirmDialog } from '../../components/index';
import { IntegerField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';
import { useActualizarAuditoria } from '../../hooks/use-actualizar-auditoria';
import { colors, typography } from '../../theme';

export interface AuditoriaConteoProps {
  readonly auditoria: AuditoriaInventario;
  readonly onFinalized: () => void;
  readonly testID?: string;
}

export function AuditoriaConteo(props: AuditoriaConteoProps): ReactElement {
  const { t } = useTranslation();
  const { mutateAsync, isPending } = useActualizarAuditoria();

  const [lineas, setLineas] = useState<AuditoriaLinea[]>(
    () => JSON.parse(props.auditoria.lineas) as AuditoriaLinea[],
  );
  const [showConfirm, setShowConfirm] = useState(false);

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
            <Card
              key={linea.productoId as string}
              padding="sm"
              fullWidth
              testID={`conteo-linea-${linea.productoId}`}
            >
              <View gap={4}>
                <Text
                  fontFamily={typography.fontFamily}
                  fontWeight={typography.weights.bold}
                  fontSize={14}
                  color={colors.black}
                  numberOfLines={1}
                >
                  {linea.productoNombre}
                </Text>
                <View flexDirection="row" gap={12} alignItems="center">
                  <Text
                    fontFamily={typography.fontFamily}
                    fontSize={12}
                    color={colors.gray600}
                  >
                    {t('auditoria.stockSistema')}: {linea.stockSistema}
                  </Text>
                  <View flex={1}>
                    <IntegerField
                      label={t('auditoria.stockReal')}
                      value={
                        linea.stockReal !== null ? String(linea.stockReal) : ''
                      }
                      onChange={(v) => handleStockChange(idx, v)}
                      min={0}
                      testID={`conteo-real-${linea.productoId}`}
                    />
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>

      <View flexDirection="row" gap={8}>
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
    </View>
  );
}
