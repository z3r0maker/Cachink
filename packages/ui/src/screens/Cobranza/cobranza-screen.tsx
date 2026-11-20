/**
 * «Fiado y abonos» (Track M, M-08; boards MvCobranza, RvFiado): who owes
 * what and who already abonó in your turno. The three figures, the search,
 * the filters and the clients as compact rows; a row opens the client's
 * page (`ClienteScreen`), where the abono and the reminder live.
 * Presentational: the route hands it `useCobranza()`.
 */
import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import type { FiltroCobranza } from '@xangarro/caja/cobranza';
import { CajaEstado, EstadoCargando } from '../../components/index';
import { Buscador, Filtros } from './cobranza-barra';
import { Cabeza, Cuerpo } from './cobranza-lista';
import { AbonosHoyPanel, ResumenFiado } from './cobranza-resumen';
import type { DatosCobranza } from './use-cobranza';

export interface CobranzaScreenProps {
  readonly state: 'cargando' | 'error' | 'happy';
  readonly data: DatosCobranza | null;
  readonly onRetry: () => void;
  /** Back to Inicio, the atajo that opened this. */
  readonly onBack: () => void;
  /** Opens the client's page. */
  readonly onAbrirCliente: (id: string) => void;
  readonly testID?: string;
}

/** Don counting while it loads; Don worried when the read fails. */
function Estados(p: CobranzaScreenProps): ReactElement {
  if (p.state === 'error') {
    return (
      <View flex={1} justifyContent="center" padding={16} testID={p.testID ?? 'cobranza'}>
        <CajaEstado
          mode="error"
          errorTitle="No pudimos cargar el fiado"
          onRetry={p.onRetry}
          testID="cobranza"
        />
      </View>
    );
  }
  return (
    <View flex={1} testID={p.testID}>
      <EstadoCargando testID="cobranza-cargando" />
    </View>
  );
}

export function CobranzaScreen(p: CobranzaScreenProps): ReactElement {
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<FiltroCobranza>('Todos');
  if (p.state !== 'happy' || p.data === null) return <Estados {...p} />;
  return (
    <View flex={1} testID={p.testID ?? 'cobranza'}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Cabeza onBack={p.onBack} />
        <ResumenFiado cuentas={p.data.cuentas} hoy={p.data.hoy} />
        <Buscador q={q} onQ={setQ} />
        <Filtros value={filtro} onChange={setFiltro} />
        <Cuerpo
          cuentas={p.data.cuentas}
          hoy={p.data.hoy}
          filtro={filtro}
          q={q}
          abrir={p.onAbrirCliente}
        />
        <AbonosHoyPanel cuentas={p.data.cuentas} hoy={p.data.hoy} />
      </ScrollView>
    </View>
  );
}
