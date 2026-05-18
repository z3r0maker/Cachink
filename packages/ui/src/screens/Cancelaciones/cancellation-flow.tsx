/**
 * CancellationFlow — multi-step cancellation: PIN -> reason -> cash confirm.
 */

import { useState, useCallback, type ReactElement } from 'react';
import { Alert } from 'react-native';
import type { BusinessId, Sale, UserId } from '@cachink/domain';
import { Modal } from '../../components/index';
import { useSalesRepository, useCancelacionLogsRepository } from '../../app/repository-provider';
import { useCurrentBusinessId, useUserId, useDeviceId } from '../../app-config/use-app-config';
import { useLogStore } from '../../observability/observability-provider';
import { logSuccessAudit, logErrorAudit } from './cancellation-audit';
import { PinStep, ReasonStep, CashConfirmStep } from './cancellation-steps';

type Step = 'pin' | 'reason' | 'cash-confirm' | 'done';

export interface CancellationFlowProps {
  readonly sale: Sale;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

function useAuditContext(sale: Sale) {
  const userId = useUserId() as UserId;
  const businessId = useCurrentBusinessId() as BusinessId;
  const deviceId = useDeviceId();
  const logStore = useLogStore();
  const isCashSale = sale.metodo === 'Efectivo';

  return { userId, businessId, deviceId, logStore, isCashSale };
}

function buildLogPayload(sale: Sale, motivo: string, ctx: ReturnType<typeof useAuditContext>) {
  return {
    saleId: sale.id,
    cancelledByUserId: ctx.userId,
    motivo: motivo.trim(),
    montoOriginalCentavos: sale.monto,
    metodoOriginal: sale.metodo,
    cashReturnedCentavos: ctx.isCashSale ? sale.monto : null,
    stockReversed: false,
    cantidadDevuelta: null,
    productoId: null,
    businessId: ctx.businessId,
  };
}

function buildAuditCtx(sale: Sale, motivo: string, ctx: ReturnType<typeof useAuditContext>) {
  return {
    sale,
    userId: ctx.userId,
    deviceId: ctx.deviceId ?? '',
    businessId: ctx.businessId ?? '',
    motivo: motivo.trim(),
    isCashSale: ctx.isCashSale,
  };
}

function useExecuteCancellation(
  props: CancellationFlowProps,
  motivo: string,
  ctx: ReturnType<typeof useAuditContext>,
) {
  const salesRepo = useSalesRepository();
  const logsRepo = useCancelacionLogsRepository();
  const [submitting, setSubmitting] = useState(false);

  const execute = useCallback(async () => {
    setSubmitting(true);
    try {
      await salesRepo.delete(props.sale.id);
      await logsRepo.create(buildLogPayload(props.sale, motivo, ctx));
      logSuccessAudit(buildAuditCtx(props.sale, motivo, ctx), ctx.logStore);
      props.onSuccess();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logErrorAudit(buildAuditCtx(props.sale, motivo, ctx), error, ctx.logStore);
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  }, [salesRepo, logsRepo, props, ctx, motivo]);

  return { execute, submitting };
}

export function CancellationFlow(
  props: CancellationFlowProps,
): ReactElement {
  const [step, setStep] = useState<Step>('pin');
  const [motivo, setMotivo] = useState('');
  const ctx = useAuditContext(props.sale);
  const { execute, submitting } = useExecuteCancellation(props, motivo, ctx);

  const handlePin = useCallback((_p: string) => { setStep('reason'); }, []);
  const handleReason = useCallback(() => {
    if (motivo.trim().length === 0) return;
    if (ctx.isCashSale) { setStep('cash-confirm'); } else { execute(); }
  }, [motivo, ctx.isCashSale, execute]);

  return (
    <Modal open onClose={props.onClose} title="Cancelar venta" testID="cancellation-flow">
      {step === 'pin' && <PinStep onSubmit={handlePin} />}
      {step === 'reason' && (
        <ReasonStep motivo={motivo} onChangeMotivo={setMotivo} onSubmit={handleReason} />
      )}
      {step === 'cash-confirm' && (
        <CashConfirmStep amount={props.sale.monto} onConfirm={execute} submitting={submitting} />
      )}
    </Modal>
  );
}
