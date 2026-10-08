/**
 * GastosScreen — «Gastos» (MvGastos; the web caja's `operador/gastos`):
 * what left the drawer in the turno, the recurring gastos already due, the
 * category chips and the list; «Registrar gasto» in the thumb zone, and the
 * phone's «Compra de inventario» beside it. Presentational: the numbers come
 * from `@xangarro/caja/gastos` (`resumen`, `filtrar`).
 */
import { useState, type ReactElement, type ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import { filtrar, resumen, type GastoTurno } from '@xangarro/caja/gastos';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';
import { Cargando, FallaLista, SinResultados, Vacio } from '../VentasTurno/estado-lista';
import { FiltrosCategoria, GastoFila, ResumenGastosTurno, type FiltroGasto } from './gastos-partes';
import type { EstadoGastos } from './use-gastos-turno';

export interface GastosScreenProps {
  readonly state: EstadoGastos;
  readonly gastos: readonly GastoTurno[];
  /** False without an open turno: the list is today's. */
  readonly conTurno: boolean;
  /** «Pendientes de registrar», when any are due. */
  readonly pendientes?: ReactNode;
  readonly onRegistrar: () => void;
  /** «Compra de inventario»; omitted where the phone has none. */
  readonly onCompra?: () => void;
  readonly onRetry: () => void;
  readonly filtroInicial?: FiltroGasto;
}

function Lista(p: { readonly gastos: readonly GastoTurno[] }): ReactElement {
  return (
    <View
      testID="gastos-lista"
      role="list"
      aria-label="Gastos"
      borderRadius={radii[5]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.white}
      overflow="hidden"
    >
      {p.gastos.map((g) => (
        <GastoFila key={g.id} g={g} />
      ))}
      {p.gastos.length === 0 ? (
        <SinResultados
          titulo="Nada en esta categoría"
          cuerpo="En tu turno no ha salido dinero para esto."
        />
      ) : null}
    </View>
  );
}

function Contenido(p: GastosScreenProps & { readonly filtro: FiltroGasto }): ReactElement {
  if (p.state === 'loading') return <Cargando testID="gastos-cargando" />;
  if (p.state === 'error')
    return (
      <FallaLista titulo="No pudimos cargar tus gastos" onRetry={p.onRetry} testID="gastos-error" />
    );
  if (p.state === 'empty')
    return (
      <Vacio
        testID="gastos-vacio"
        titulo={p.conTurno ? 'Sin gastos en este turno' : 'Sin gastos hoy'}
        cuerpo="Cuando saques dinero de la caja para algo del negocio, regístralo aquí."
      />
    );
  return <Lista gastos={filtrar(p.gastos, p.filtro, '')} />;
}

function Registrar(p: GastosScreenProps): ReactElement {
  return (
    <View paddingHorizontal={16} paddingTop={8} paddingBottom={12}>
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        icon={<PathIcon d={COBRAR_GLYPHS.mas} size={20} strokeWidth={2.6} />}
        onPress={p.onRegistrar}
        testID="gastos-registrar"
      >
        Registrar gasto
      </Btn>
    </View>
  );
}

function Cabeza(p: GastosScreenProps): ReactElement {
  return (
    <View gap={2}>
      <View flexDirection="row" alignItems="center" gap={10}>
        <MText flex={1} role="heading" aria-level={1} size="xl4" weight="extraBold">
          Gastos
        </MText>
        {p.onCompra ? (
          <Btn variant="secondary" size="md" onPress={p.onCompra} testID="gastos-compra">
            Compra de inventario
          </Btn>
        ) : null}
      </View>
      <MText size="md" weight="semibold" color={colors.gray600}>
        {p.conTurno ? 'Lo que salió de la caja en tu turno' : 'Lo que salió de la caja hoy'}
      </MText>
    </View>
  );
}

export function GastosScreen(props: GastosScreenProps): ReactElement {
  const [filtro, setFiltro] = useState<FiltroGasto>(props.filtroInicial ?? 'Todos');
  const conDatos = props.state === 'happy';
  return (
    <View flex={1} testID="gastos" backgroundColor={colors.gray200}>
      <View paddingHorizontal={16} paddingTop={14} paddingBottom={6} gap={10}>
        <Cabeza {...props} />
        {conDatos ? <ResumenGastosTurno r={resumen(props.gastos)} /> : null}
      </View>
      {conDatos ? (
        <View>
          <FiltrosCategoria value={filtro} onChange={setFiltro} />
        </View>
      ) : null}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {props.pendientes}
        <Contenido {...props} filtro={filtro} />
      </ScrollView>
      <Registrar {...props} />
    </View>
  );
}
