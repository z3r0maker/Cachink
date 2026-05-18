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

function parseStockValue(value: string): number | null {
  const parsed = value.trim() === '' ? null : Number(value);
  return parsed !== null && Number.isInteger(parsed) ? parsed : null;
}

function useConteoState(auditoria: AuditoriaInventario, onFinalized: () => void, onCancelled: () => void) {
  const { mutateAsync, isPending } = useActualizarAuditoria();
  const [lineas, setLineas] = useState<AuditoriaLinea[]>(
    () => JSON.parse(auditoria.lineas) as AuditoriaLinea[],
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const contados = lineas.filter((l) => l.stockReal !== null).length;
  const allCounted = contados === lineas.length;
  const discrepancias = lineas.filter((l) => l.diferencia !== null && l.diferencia !== 0).length;

  const handleStockChange = (idx: number, value: string): void => {
    const stockReal = parseStockValue(value);
    setLineas((prev) => {
      const next = [...prev];
      const linea = next[idx];
      if (!linea) return prev;
      next[idx] = { ...linea, stockReal, diferencia: stockReal !== null ? stockReal - linea.stockSistema : null };
      return next;
    });
  };

  const save = async () => mutateAsync({ id: auditoria.id, lineas, estado: 'borrador' });
  const finalize = async () => { await mutateAsync({ id: auditoria.id, lineas, estado: 'finalizada' }); setShowConfirm(false); onFinalized(); };
  const cancel = async () => { await mutateAsync({ id: auditoria.id, lineas, estado: 'cancelada' }); setShowCancel(false); onCancelled(); };

  return { lineas, isPending, contados, allCounted, discrepancias, showConfirm, setShowConfirm, showCancel, setShowCancel, handleStockChange, save, finalize, cancel };
}

type T = ReturnType<typeof useTranslation>['t'];

function ConteoActionBar({ ctx, t }: { ctx: ReturnType<typeof useConteoState>; t: T }): ReactElement {
  return (
    <View flexDirection="row" gap={8}>
      <View flex={1}>
        <Btn variant="ghost" onPress={() => ctx.setShowCancel(true)} disabled={ctx.isPending} fullWidth testID="conteo-cancelar">
          {t('auditoria.cancelar' as never)}
        </Btn>
      </View>
      <View flex={1}>
        <Btn variant="ghost" onPress={ctx.save} disabled={ctx.isPending} fullWidth testID="conteo-save">
          {t('actions.save' as never)}
        </Btn>
      </View>
      <View flex={1}>
        <Btn onPress={() => ctx.setShowConfirm(true)} disabled={!ctx.allCounted || ctx.isPending} fullWidth testID="conteo-finalizar">
          {t('auditoria.finalizar' as never)}
        </Btn>
      </View>
    </View>
  );
}

function ConteoDialogs({ ctx, t }: { ctx: ReturnType<typeof useConteoState>; t: T }): ReactElement {
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
        fontFamily={typography.fontFamily} fontWeight={typography.weights.semibold}
        fontSize={14} color={colors.gray600} testID="conteo-counter"
      >
        {t('auditoria.contados', { contados: String(ctx.contados), total: String(ctx.lineas.length) })}
      </Text>
      <ScrollView>
        <View gap={8}>
          {ctx.lineas.map((linea, idx) => (
            <ConteoLineaCard key={linea.productoId as string} linea={linea} onChange={(v) => ctx.handleStockChange(idx, v)} />
          ))}
        </View>
      </ScrollView>
      <ConteoActionBar ctx={ctx} t={t} />
      <ConteoDialogs ctx={ctx} t={t} />
    </View>
  );
}
