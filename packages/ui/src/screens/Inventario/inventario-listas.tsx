/**
 * Inventario's two lists (MvInventario): Existencias, filtered by the search
 * (`buscar`), each product opening its movement sheet; and «Movimientos · N»,
 * the turno's entradas and mermas, newest first.
 */
import type { ReactElement, ReactNode } from 'react';
import { View } from '@tamagui/core';
import { buscar, type Pestana } from '@xangarro/caja/inventario';
import { MText } from '../../components/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { ExistenciaFila, MovimientoFila } from './inventario-filas';
import type { ExistenciaMovil, InventarioLeido } from './inventario-registro';

function Tarjeta({ children, label }: { children: ReactNode; label: string }): ReactElement {
  return (
    <View
      role="list"
      aria-label={label}
      borderRadius={radii[6]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.white}
      overflow="hidden"
    >
      {children}
    </View>
  );
}

function Nada({ texto, testID }: { texto: string; testID: string }): ReactElement {
  return (
    <MText testID={testID} size="body" color={colors.gray600} textAlign="center" padding={24}>
      {texto}
    </MText>
  );
}

function Movimientos({ data }: { data: InventarioLeido }): ReactElement {
  const movs = [...data.movimientos].reverse();
  return (
    <Tarjeta label="Movimientos de mi turno">
      {movs.length === 0 ? (
        <Nada
          testID="inventario-sin-movs"
          texto="Todavía no registras entradas ni mermas en este turno."
        />
      ) : null}
      {movs.map((m, i) => (
        <MovimientoFila
          key={m.id}
          m={m}
          e={data.existencias.find((e) => e.id === m.existenciaId)}
          ultima={i === movs.length - 1}
        />
      ))}
    </Tarjeta>
  );
}

export function InventarioListas(p: {
  data: InventarioLeido;
  tab: Pestana;
  q: string;
  abierto: string | null;
  onAbrir: (e: ExistenciaMovil) => void;
}): ReactElement {
  if (p.tab === 'movimientos') return <Movimientos data={p.data} />;
  const filas = buscar(p.data.existencias, p.q) as readonly ExistenciaMovil[];
  return (
    <Tarjeta label="Existencias">
      {filas.length === 0 ? (
        <Nada testID="inventario-sin-resultados" texto={`No hay productos con «${p.q.trim()}».`} />
      ) : null}
      {filas.map((e, i) => (
        <ExistenciaFila
          key={e.id}
          e={e}
          abierta={p.abierto === e.id}
          ultima={i === filas.length - 1}
          onPress={() => p.onAbrir(e)}
        />
      ))}
    </Tarjeta>
  );
}
