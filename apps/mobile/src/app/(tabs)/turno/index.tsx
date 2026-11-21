/**
 * Expo Router entry for /turno («Mi turno», Track M, M-09; board MvTurno):
 * the turno's figures and the queue band, «Lo de tu turno»'s rows to Gastos,
 * Fiado y abonos, Inventario, Avisos, Registros por enviar, «¿Algo no
 * funciona?» (the report sheet, M-23) and Ajustes, and
 * the fixed foot: «Bloquear la caja» and «Cerrar turno» to /cierre. With no
 * open turno, «Abrir turno» opens the fondo sheet here (MvTurnoCerrado).
 */

import type { ReactElement } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  MiTurnoScreen,
  TurnoRows,
  useAperturaTurno,
  useLoDeTuTurno,
  useMiTurno,
  useReportar,
  useReportesPorEnviar,
  useSetUserId,
} from '@xangarro/ui';

export default function TurnoTabRoute(): ReactElement {
  const router = useRouter();
  const setUserId = useSetUserId();
  const t = useMiTurno();
  const filas = useLoDeTuTurno(t.data, t.cola.porEnviar);
  const apertura = useAperturaTurno();
  const abrirReporte = useReportar((s) => s.abrir);
  const reportesPorEnviar = useReportesPorEnviar();
  return (
    <View style={{ flex: 1 }}>
      <MiTurnoScreen
        testID="mobile-turno"
        state={t.state}
        data={t.data}
        cola={t.cola}
        onCerrar={() => router.navigate('/cierre' as never)}
        onBloquear={() => setUserId(null)}
        onRetry={t.refetch}
        onIrAInicio={() => router.navigate('/inicio' as never)}
        onAbrirTurno={apertura.abrir}
        filas={
          <TurnoRows
            onNavigate={(path) => router.navigate(path as never)}
            vivas={filas}
            onReportar={() => abrirReporte()}
            reportesPorEnviar={reportesPorEnviar}
          />
        }
      />
      {apertura.hoja}
    </View>
  );
}
