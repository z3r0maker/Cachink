/**
 * AbrirTurnoFlow — the fondo sheet wired to the device: the signed-in
 * operator's first name, the last close on this device as the hint and the
 * starting figure, and `AbrirCajaUseCase` through `useAbrirCaja` (which
 * refreshes the caja queries, so Inicio and Mi turno turn to «Turno
 * abierto»). Mounted only while open, so each opening starts fresh.
 */
import type { ReactElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BusinessId } from '@xangarro/domain';
import { useCajaTurnosRepository } from '../../app/repository-provider';
import { useCurrentBusinessId, useUserId } from '../../app-config/use-app-config';
import { useAbrirCaja } from '../../hooks/use-abrir-caja';
import { cajaKeys } from '../../hooks/query-keys';
import { useTranslation } from '../../i18n/index';
import { useShellData } from '../AppShell/use-shell-data';
import { primerNombreDe } from '../Login/nip';
import { AbrirTurnoSheet } from './abrir-turno-sheet';
import { textoUltimo, type UltimoCierre } from './ultimo-cierre';

export interface AbrirTurnoFlowProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

/** The newest closed turno on this device, if any. */
export function useUltimoCierre(): UltimoCierre | null {
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const turnos = useCajaTurnosRepository();
  const q = useQuery({
    queryKey: [...cajaKeys.byBusiness(businessId), 'ultimo-cierre'],
    queryFn: () => (businessId ? turnos.findLatest(businessId) : null),
    enabled: businessId !== null,
  });
  const t = q.data;
  if (!t || t.cierreAt === null || t.montoCierreCentavos === null) return null;
  return { fecha: t.fecha, monto: t.montoCierreCentavos };
}

function Abierta(props: AbrirTurnoFlowProps): ReactElement {
  const { t } = useTranslation();
  const userId = useUserId();
  const operador = useShellData().operador;
  const ultimo = useUltimoCierre();
  const abrir = useAbrirCaja();
  return (
    <AbrirTurnoSheet
      open
      onClose={props.onClose}
      nombre={operador ? primerNombreDe(operador.nombre) : null}
      ultimo={textoUltimo(t, ultimo, new Date())}
      sugerido={ultimo?.monto ?? null}
      submitting={abrir.isPending}
      error={abrir.error ? abrir.error.message || t('entrar.abrirTurno.error') : null}
      onAbrir={(fondo) => {
        if (userId === null) return;
        abrir.mutate({ userId, montoAperturaCentavos: fondo }, { onSuccess: props.onClose });
      }}
    />
  );
}

export function AbrirTurnoFlow(props: AbrirTurnoFlowProps): ReactElement | null {
  return props.open ? <Abierta {...props} /> : null;
}
