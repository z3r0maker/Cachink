/**
 * Inventario (MvInventario, the web's OpInventario; M-09): what there is and
 * what moved in this turno. The figures, the Existencias list with its
 * search and level bars, and «Movimientos · N» with the turno's entradas and
 * mermas, newest first. A product opens its movement sheet: «Llegó
 * mercancía» or «Se echó a perder o se dañó (merma)». The caja operates, it
 * doesn't manage: no product is created, edited or deleted here.
 */
import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import type { Pestana } from '@xangarro/caja/inventario';
import { CajaEstado, Toast } from '../../components/index';
import { InventarioCabeza } from './inventario-cabeza';
import type { ExistenciaMovil, InventarioLeido } from './inventario-lectura';
import { InventarioListas } from './inventario-listas';
import { tipoAlAbrir, type Borrador } from './mover-logica';
import { MoverSheet } from './mover-sheet';
import { useInventarioVista, type Pedido } from './use-inventario-vista';

export interface InventarioScreenProps {
  readonly state: 'loading' | 'error' | 'empty' | 'happy';
  readonly data: InventarioLeido;
  /** The plan carries no stock: the empty state says so. */
  readonly sinInventario?: boolean;
  readonly dueno: string;
  readonly registrando: boolean;
  readonly onRegistrar: (b: Borrador, e: ExistenciaMovil) => Promise<void>;
  readonly onRetry: () => void;
  /** Opens a product's sheet on arrival (Inicio's «Reponer», an old product link). */
  readonly abrir?: Pedido | null;
  readonly tabInicial?: Pestana;
}

function Estado(p: InventarioScreenProps & { state: 'loading' | 'error' | 'empty' }): ReactElement {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <CajaEstado
        mode={p.state}
        emptyTitle={
          p.sinInventario ? 'Esta caja no lleva inventario' : 'Sin productos con existencias'
        }
        emptyBody={`Cuando ${p.dueno} dé de alta el catálogo con sus existencias, aquí podrás registrar lo que llega y lo que se echa a perder.`}
        errorTitle="No pudimos leer el inventario"
        onRetry={p.onRetry}
        testID="inventario"
      />
    </ScrollView>
  );
}

function Hojas(x: {
  p: InventarioScreenProps;
  v: ReturnType<typeof useInventarioVista>;
}): ReactElement {
  const { p, v } = x;
  return (
    <>
      {v.toast ? (
        <Toast
          floating
          title="Movimiento registrado"
          body={v.toast}
          tone="ok"
          onClose={() => v.setToast(null)}
          testID="inventario-toast"
        />
      ) : null}
      <MoverSheet
        e={v.e}
        tipo={v.abierto?.tipo ?? 'Entrada'}
        dueno={p.dueno}
        registrando={p.registrando}
        error={v.error}
        onClose={v.cerrar}
        onRegistrar={v.registrar}
      />
    </>
  );
}

const LISTA = { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 16 } as const;

export function InventarioScreen(p: InventarioScreenProps): ReactElement {
  const v = useInventarioVista(p.data, p.onRegistrar, { tab: p.tabInicial, abrir: p.abrir });
  if (p.state !== 'happy') return <Estado {...p} state={p.state} />;
  return (
    <View flex={1} testID="inventario">
      <InventarioCabeza
        items={p.data.existencias}
        movs={p.data.movimientos}
        tab={v.tab}
        onTab={v.setTab}
        q={v.q}
        onQ={v.setQ}
      />
      <ScrollView contentContainerStyle={LISTA} keyboardShouldPersistTaps="handled">
        <InventarioListas
          data={p.data}
          tab={v.tab}
          q={v.q}
          abierto={v.abierto?.id ?? null}
          onAbrir={(e) => v.setAbierto({ id: e.id, tipo: tipoAlAbrir(e) })}
        />
      </ScrollView>
      <Hojas p={p} v={v} />
    </View>
  );
}
