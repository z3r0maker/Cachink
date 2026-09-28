/**
 * VentasTurnoScreen — the Ventas tab (MvVentas; the web caja's
 * `operador/ventas`): the turno's sales with Cobrado, En efectivo and
 * Canceladas, the search, the method chips and one row per ticket. A row
 * opens the sale's sheet; the operator only cancels a sale, with a reason,
 * never edits or deletes it.
 *
 * Presentational: the numbers come from `@xangarro/caja/ventas` (`resumen`,
 * `filtrar`), the rows from `useVentasTurno` through the flow.
 */
import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import { filtrar, resumen, type VentaTurno } from '@xangarro/caja/ventas';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { Cargando, FallaLista, SinResultados, Vacio } from './estado-lista';
import type { EstadoVentas } from './use-ventas-turno';
import { VentaFila } from './venta-fila';
import { Buscador, FiltrosMetodo, ResumenTurno, type FiltroVenta } from './ventas-partes';

export interface VentasTurnoScreenProps {
  readonly state: EstadoVentas;
  readonly ventas: readonly VentaTurno[];
  /** «08:15»: when the turno opened. */
  readonly desde: string | null;
  /** The folio whose sheet is open, to mark its row. */
  readonly abierta: string | null;
  readonly onAbrir: (folio: string) => void;
  readonly onRetry: () => void;
  /** No turno open: the way to Inicio, where it opens. */
  readonly onIrAInicio: () => void;
  readonly filtroInicial?: FiltroVenta;
}

function Cabeza(p: { readonly activas: number; readonly desde: string | null }): ReactElement {
  const sub = `${p.activas} en tu turno${p.desde ? `, desde las ${p.desde}` : ''}`;
  return (
    <View flexDirection="row" alignItems="baseline" gap={10} flexWrap="wrap">
      <MText role="heading" aria-level={1} size="xl4" weight="extraBold" letterSpacing={-0.9}>
        Ventas
      </MText>
      <MText size="md" weight="semibold" color={colors.gray600}>
        {sub}
      </MText>
    </View>
  );
}

function Lista(p: VentasTurnoScreenProps & { readonly filas: readonly VentaTurno[] }) {
  return (
    <View
      testID="ventas-lista"
      role="list"
      aria-label="Ventas"
      borderRadius={radii[5]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.white}
      overflow="hidden"
    >
      {p.filas.map((v) => (
        <VentaFila
          key={v.folio}
          v={v}
          abierta={p.abierta === v.folio}
          onPress={() => p.onAbrir(v.folio)}
        />
      ))}
      {p.filas.length === 0 ? (
        <SinResultados
          titulo="No hay ventas con ese filtro"
          cuerpo="Prueba con otra forma de pago o borra la búsqueda."
        />
      ) : null}
    </View>
  );
}

function SinLista(p: VentasTurnoScreenProps): ReactElement {
  if (p.state === 'loading') return <Cargando testID="ventas-cargando" />;
  if (p.state === 'error')
    return (
      <FallaLista titulo="No pudimos cargar tus ventas" onRetry={p.onRetry} testID="ventas-error" />
    );
  if (p.state === 'sin-turno')
    return (
      <Vacio
        testID="ventas-sin-turno"
        titulo="No hay turno abierto"
        cuerpo="Abre tu turno en Inicio para cobrar. Aquí verás cada venta con su folio."
        accion={
          <Btn variant="secondary" onPress={p.onIrAInicio} testID="ventas-ir-inicio">
            Ir a Inicio
          </Btn>
        }
      />
    );
  return (
    <Vacio
      testID="ventas-vacio"
      titulo="Sin ventas en este turno"
      cuerpo="Cuando cobres la primera, aparece aquí con su folio y cómo te pagaron."
    />
  );
}

export function VentasTurnoScreen(props: VentasTurnoScreenProps): ReactElement {
  const [filtro, setFiltro] = useState<FiltroVenta>(props.filtroInicial ?? 'Todos');
  const [query, setQuery] = useState('');
  const r = resumen(props.ventas);
  const conDatos = props.state === 'happy';
  return (
    <View flex={1} testID="ventas-turno" backgroundColor={colors.gray200}>
      <View paddingHorizontal={16} paddingTop={14} paddingBottom={6} gap={10}>
        <Cabeza activas={r.activas} desde={props.desde} />
        {conDatos ? <ResumenTurno r={r} /> : null}
        {conDatos ? <Buscador value={query} onChange={setQuery} /> : null}
      </View>
      {conDatos ? (
        <View>
          <FiltrosMetodo value={filtro} onChange={setFiltro} />
        </View>
      ) : null}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {conDatos ? (
          <Lista {...props} filas={filtrar(props.ventas, filtro, query)} />
        ) : (
          <SinLista {...props} />
        )}
      </ScrollView>
    </View>
  );
}
