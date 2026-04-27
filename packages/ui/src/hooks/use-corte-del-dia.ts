/**
 * `useCorteDelDia` — returns today's corte for the active device, if
 * one was already closed (Slice 3 C5).
 *
 * Used by the Operativo home to hide the CorteDeDiaCard once the day's
 * corte exists — the parent composes `useCorteGate` (time gate) AND
 * `useCorteDelDia` (already-closed gate) to decide visibility.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { DayClose, DeviceId, IsoDate } from '@cachink/domain';
import { useDayClosesRepository } from '../app/index';
import { useDeviceId } from '../app-config/index';

export interface UseCorteDelDiaOptions {
  readonly fecha: IsoDate;
  /**
   * Override the device id read from `useDeviceId`. Tests and the
   * settings screen pass this explicitly; production usually omits it.
   */
  readonly deviceId?: DeviceId;
}

export function useCorteDelDia(
  options: UseCorteDelDiaOptions,
): UseQueryResult<DayClose | null, Error> {
  const closes = useDayClosesRepository();
  const defaultDeviceId = useDeviceId();
  const deviceId = options.deviceId ?? defaultDeviceId;

  return useQuery<DayClose | null, Error>({
    queryKey: ['corte-del-dia', deviceId, options.fecha],
    enabled: deviceId !== null,
    async queryFn() {
      if (!deviceId) return null;
      return closes.findByDate(options.fecha, deviceId);
    },
  });
}
