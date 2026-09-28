/**
 * useCierreMovil — Cierre's data and actions for the signed-in operator: the
 * open turno read as `CierreData` (`leerFilasCierre` → `cierreMovil`), the
 * count (`useConteoCierre`), the queue as the pill counts it (ADR-123), and
 * the close through `CerrarCajaUseCase` (`useCerrarCaja`) with the reason,
 * the note and the pieces. Once it closes, the snapshot stays on screen.
 */
import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hoyLocal } from '@xangarro/caja';
import { fechaCorta, type CierreData } from '@xangarro/caja/cierre';
import { diferenciaCorte, type BusinessId, type CajaTurno, type UserId } from '@xangarro/domain';
import { useCloudSync } from '../../app/cloud-sync-bridge';
import { useRepositories } from '../../app/repository-provider';
import { useCurrentBusinessId, useDeviceId, useUserId } from '../../app-config/use-app-config';
import { cajaKeys } from '../../hooks/query-keys';
import { useCerrarCaja } from '../../hooks/use-cerrar-caja';
import { useTranslation } from '../../i18n/index';
import { useShellData } from '../AppShell/use-shell-data';
import { useDueno } from '../Inicio/use-inicio';
import { cierreMovil, leerFilasCierre } from './cierre-lectura';
import { entradaCierre } from './cierre-logica';
import type { CierreHecho, CierreState, CierreVista, ColaCierre } from './cierre-tipos';
import { useConteoCierre, type ConteoCierre } from './use-conteo-cierre';

function estadoCierre(error: boolean, cargado: boolean, data: CierreData | null): CierreState {
  if (error) return 'error';
  if (!cargado) return 'loading';
  return data ? 'happy' : 'sin-turno';
}

function useDatosCierre() {
  const { t } = useTranslation();
  const repos = useRepositories();
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const userId = useUserId();
  const deviceId = useDeviceId();
  const shell = useShellData();
  const dueno = useDueno();
  const hoy = hoyLocal();
  const q = useQuery({
    queryKey: [...cajaKeys.byBusiness(businessId), 'cierre', userId, hoy],
    queryFn: () => leerFilasCierre(repos, businessId as BusinessId, userId as UserId, hoy),
    enabled: businessId !== null && userId !== null,
  });
  const operador = shell.operador?.nombre ?? null;
  const data: CierreData | null =
    q.data && operador
      ? cierreMovil(q.data, {
          operador,
          caja: shell.caja ?? t('shell.cajaSinNombre'),
          negocio: shell.negocio,
          dueno,
          deviceId,
          ahora: new Date(),
        })
      : null;
  const state = estadoCierre(q.isError, q.data !== undefined && operador !== null, data);
  return { state, data, turno: q.data?.turno ?? null, refetch: q.refetch };
}

function useCola(): ColaCierre {
  const { state, syncNow } = useCloudSync();
  return {
    porEnviar: state.counts.unsent,
    reintentando: state.counts.retrying,
    enviando: state.phase === 'syncing',
    reintentar: syncNow,
  };
}

function useCerrar(
  turno: CajaTurno | null,
  data: CierreData | null,
  x: ConteoCierre,
  cola: ColaCierre,
) {
  const cerrar = useCerrarCaja();
  const [hecho, setHecho] = useState<CierreHecho | null>(null);
  const [fallo, setFallo] = useState(false);
  const enviar = (): void => {
    if (turno === null || data === null || !x.puede || cerrar.isPending) return;
    setFallo(false);
    cerrar.mutate(
      { turnoId: turno.id, ...entradaCierre(x, x.conteo, x.motivo, x.nota) },
      {
        onSuccess: (t) => {
          const esperado = t.efectivoEsperadoCentavos ?? x.esperado;
          const dif = diferenciaCorte(x.contado, esperado);
          const motivo = dif.tipo === 'cuadra' ? null : x.motivo;
          setHecho({
            data,
            contado: x.contado,
            esperado,
            dif,
            motivo,
            porEnviar: cola.porEnviar,
            fecha: fechaCorta(),
          });
        },
        onError: () => setFallo(true),
      },
    );
  };
  return { cerrar: enviar, cerrando: cerrar.isPending, fallo, hecho };
}

export function useCierreMovil(): CierreVista {
  const d = useDatosCierre();
  const conteo = useConteoCierre(d.data);
  const cola = useCola();
  const c = useCerrar(d.turno, d.data, conteo, cola);
  const { refetch } = d;
  const recargar = useCallback(() => void refetch(), [refetch]);
  return { state: d.state, data: d.data, conteo, cola, ...c, refetch: recargar };
}
