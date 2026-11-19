/**
 * useTurnoDeOtro — whether the signed-in operator must choose about the
 * caja's open turno (M-18, ADR-071 §3; MvTurnoDeOtro), and the words and
 * actions of that screen. Null when there is nothing to choose: no open
 * turno, the operator's own, or one they already chose to continue.
 *
 * «Seguir» remembers the choice; «Cerrar» remembers it too, so the screen
 * steps aside for the close the host opens; «Volver» signs out and drops the
 * lock, back to «¿Quién va a cobrar?».
 */
import { useQuery } from '@tanstack/react-query';
import { hhmmLocal, hoyLocal } from '@xangarro/caja';
import { TURNO_DE_OTRO } from '@xangarro/caja/turno';
import type { BusinessId } from '@xangarro/domain';
import { useActivationState } from '../../activation/index';
import { useCajaLock } from '../../app/caja-lock';
import { useRepositories } from '../../app/repository-provider';
import { debeElegir, useTurnoSeguido } from '../../app/turno-seguido';
import { useAccesoContexto } from '../../app/use-acceso-contexto';
import {
  useAppConfigStore,
  useCurrentBusinessId,
  useUserId,
} from '../../app-config/use-app-config';
import { useNombreDe } from '../../hooks/use-nombre-de';
import { useOpenCajaTurno } from '../../hooks/use-open-caja-turno';
import { inicialesDe } from '../AppShell/use-shell-data';
import { miTurnoKey } from '../Turno/use-mi-turno';
import { leerTurnoVivo } from '../Turno/mi-turno-lectura';
import type { TurnoDeOtroScreenProps } from './turno-de-otro-screen';

export type TurnoDeOtro = Omit<TurnoDeOtroScreenProps, 'onCerrar'> & {
  /** «Contar y cerrar»: step aside; the host opens the close. */
  readonly alCerrar: () => void;
};

/** Fondo and sales of the open turno, read as Mi turno reads them (one cache). */
function useCifras(activo: boolean): { readonly fondo: bigint; readonly ventas: number } {
  const repos = useRepositories();
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const userId = useUserId();
  const deviceId = useActivationState().record?.deviceId ?? '';
  const q = useQuery({
    queryKey: [...miTurnoKey(businessId, userId), hoyLocal()],
    queryFn: () => leerTurnoVivo(repos, businessId as BusinessId, deviceId),
    enabled: activo && businessId !== null,
  });
  const cierre = q.data?.vivo.cierre;
  return {
    fondo: BigInt(cierre?.fondoCentavos ?? '0'),
    ventas: cierre?.resumen.ventas ?? 0,
  };
}

export function useTurnoDeOtro(): TurnoDeOtro | null {
  const userId = useUserId();
  const businessId = useCurrentBusinessId() as BusinessId;
  const { openTurno } = useOpenCajaTurno();
  const seguido = useTurnoSeguido((s) => s.seguido);
  const seguir = useTurnoSeguido((s) => s.seguir);
  const activo = debeElegir(openTurno, userId, seguido);
  const titular = useNombreDe(activo && openTurno !== null ? openTurno.userId : null);
  const operador = useNombreDe(activo ? userId : null) ?? '';
  const cifras = useCifras(activo);
  const { contexto } = useAccesoContexto(businessId);
  if (!activo || openTurno === null || userId === null || titular === null) return null;
  const elegir = (): void => seguir(openTurno.id, userId);
  return {
    contexto,
    titular,
    iniciales: inicialesDe(titular),
    detalle: TURNO_DE_OTRO.detalle(hhmmLocal(openTurno.aperturaAt), cifras.fondo, cifras.ventas),
    operador,
    onSeguir: elegir,
    alCerrar: elegir,
    onVolver: () => {
      useAppConfigStore.getState().setUserId(null);
      // Signing out records a lock for this person; going back is not a lock.
      useCajaLock.getState().soltar();
    },
  };
}
