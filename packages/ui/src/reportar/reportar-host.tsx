/**
 * ReportarHost — the one report sheet over the app (M-23, ADR-162), so the
 * header's help button, Mi turno's «¿Algo no funciona?» and Ajustes all open
 * the same sheet from any screen. It also sends what waited on the device
 * when the connection returns.
 *
 * Mount it **inside** the gated content, as a sibling of the navigator:
 * `AppProviders`' `overlays` render outside `ActivationProvider` and
 * `CloudSyncBridge`, where there is no device token and no sync state.
 */
import type { ReactElement } from 'react';
import type { DeviceContext } from '@xangarro/observability';
import { useCajaLayout } from '../screens/AppShell/use-caja-layout';
import { useOperador } from '../screens/AppShell/use-shell-data';
import { ReportarHoja } from './reportar-hoja';
import { useReportar } from './reportar-store';
import { useDrenarReportes, useEnviarReporte, useReportesPorEnviar } from './use-reportes';

export function ReportarHost(props: {
  /** The build the report comes from; the app shell knows it. */
  readonly deviceContext?: DeviceContext | null;
}): ReactElement {
  const { abierto, eventId, cerrar } = useReportar();
  const enviar = useEnviarReporte(props.deviceContext);
  const porEnviar = useReportesPorEnviar();
  const operador = useOperador();
  const ancho = useCajaLayout() !== 'phone';
  useDrenarReportes();
  return (
    <ReportarHoja
      open={abierto}
      onClose={cerrar}
      onEnviar={(report) => enviar({ ...report, eventId })}
      nombre={operador?.nombre ?? null}
      porEnviar={porEnviar}
      ancho={ancho}
    />
  );
}
