/**
 * AuditoriaConteo — counting UI for an active inventory audit.
 * Shows product list with stockSistema and editable stockReal,
 * a running counter, and a "Finalizar" button.
 */

import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { AuditoriaInventario, AuditoriaLinea } from '@cachink/domain';
import { ConfirmDialog } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { useActualizarAuditoria } from '../../hooks/use-actualizar-auditoria';
import { colors, typography } from '../../theme';
import { ConteoLineaCard } from './conteo-linea-card';
import { ConteoActionBar } from './conteo-action-bar';

export interface AuditoriaConteoProps {
  readonly auditoria: AuditoriaInventario;
  readonly onFinalized: () => void;
  readonly onCancelled: () => void;
  readonly testID?: string;
}

function parseStockValue(value: string): number | null {
  const parsed = value.trim() === '' ? null : Number(value);
  return parsed !== null && Number.isInteger(parsed) ? parsed : null;
}

function computeDiferencia(stockReal: number | null, stockSistema: number): number | null {
  return stockReal !== null ? stockReal - stockSistema : null;
}

function updateLinea(prev: AuditoriaLinea[], idx: number, value: string): AuditoriaLinea[] {
  const next = [...prev];
  const linea = next[idx];
  if (!linea) return prev;
  const stockReal = parseStockValue(value);
  next[idx] = { ...linea, stockReal, diferencia: computeDiferencia(stockReal, linea.stockSistema) };
  return next;
}

function useConteoDialogs() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  return { showConfirm, setShowConfirm, showCancel, setShowCancel };
}

function useConteoState(
  auditoria: AuditoriaInventario,
  onFinalized: () => void,
  onCancelled: () => void,
) {
  const { mutateAsync, isPending } = useActualizarAuditoria();
  const [lineas, setLineas] = useState<AuditoriaLinea[]>(
    () => JSON.parse(auditoria.lineas) as AuditoriaLinea[],
  );
  const dialogs = useConteoDialogs();
  const contados = lineas.filter((l) => l.stockReal !== null).length;
  const discrepancias = lineas.filter((l) => l.diferencia !== null && l.diferencia !== 0).length;
  const handleStockChange = (idx: number, value: string): void =>
    setLineas((prev) => updateLinea(prev, idx, value));

  const save = async () => mutateAsync({ id: auditoria.id, lineas, estado: 'borrador' });
  const finalize = async () => {
    await mutateAsync({ id: auditoria.id, lineas, estado: 'finalizada' });
    dialogs.setShowConfirm(false);
    onFinalized();
  };
  const cancel = async () => {
    await mutateAsync({ id: auditoria.id, lineas, estado: 'cancelada' });
    dialogs.setShowCancel(false);
    onCancelled();
  };

  return {
    lineas,
    isPending,
    contados,
    allCounted: contados === lineas.length,
    discrepancias,
    ...dialogs,
    handleStockChange,
    save,
    finalize,
    cancel,
  };
}

function ConteoDialogs({
  ctx,
  t,
}: {
  ctx: ReturnType<typeof useConteoState>;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <>
      <ConfirmDialog
        open={ctx.showConfirm}
        onClose={() => ctx.setShowConfirm(false)}
        title={t('auditoria.confirmarFinalizar' as never)}
        description={t('auditoria.confirmarFinalizarDesc' as never, { count: ctx.discrepancias })}
        onConfirm={ctx.finalize}
        confirmLabel={t('auditoria.finalizar' as never)}
        tone="default"
      />
      <ConfirmDialog
        open={ctx.showCancel}
        onClose={() => ctx.setShowCancel(false)}
        title={t('auditoria.cancelar' as never)}
        description={t('auditoria.cancelarConfirm' as never)}
        onConfirm={ctx.cancel}
        confirmLabel={t('auditoria.cancelar' as never)}
        tone="danger"
      />
    </>
  );
}

export function AuditoriaConteo(props: AuditoriaConteoProps): ReactElement {
  const { t } = useTranslation();
  const ctx = useConteoState(props.auditoria, props.onFinalized, props.onCancelled);

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
          contados: String(ctx.contados),
          total: String(ctx.lineas.length),
        })}
      </Text>
      <ScrollView>
        <View gap={8}>
          {ctx.lineas.map((linea, idx) => (
            <ConteoLineaCard
              key={linea.productoId as string}
              linea={linea}
              onChange={(v) => ctx.handleStockChange(idx, v)}
            />
          ))}
        </View>
      </ScrollView>
      <ConteoActionBar
        isPending={ctx.isPending}
        allCounted={ctx.allCounted}
        onCancel={() => ctx.setShowCancel(true)}
        onSave={ctx.save}
        onFinalize={() => ctx.setShowConfirm(true)}
        t={t}
      />
      <ConteoDialogs ctx={ctx} t={t} />
    </View>
  );
}
