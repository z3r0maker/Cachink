/**
 * The Gastos list itself (M-08, RvGastos): the turno's rows in a quiet panel,
 * or its two empty answers — «Nada en esta categoría» while a chip filters
 * everything out, and Don's «No ha salido dinero de la caja» when nothing has
 * left the drawer — plus «Pendientes de registrar», the due recurring gastos.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { GastoTurno, RecurrentePorPagar } from '@xangarro/caja/gastos';
import { EstadoVacio } from '../../components/CajaEstado/index';
import { MText } from '../../components/Mostrador/index';
import { QuietPanel } from '../../components/Panel/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, colors, radii } from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';
import { GastoFila, PendienteFila } from './gasto-fila';

/** The board's centered empty answer: a yellow tile, a title, a body. */
function Vacio(p: {
  readonly titulo: string;
  readonly cuerpo: string;
  readonly testID: string;
}): ReactElement {
  return (
    <View testID={p.testID} padding={32} gap={10} alignItems="center">
      <View
        width={56}
        height={56}
        alignItems="center"
        justifyContent="center"
        borderRadius={radii[4]}
        borderWidth={borderWidths.thick}
        borderColor={colors.black}
        backgroundColor={colors.yellowSoft}
        aria-hidden
      >
        <PathIcon d={COBRAR_GLYPHS.buscar} size={26} strokeWidth={2.3} />
      </View>
      <MText size="lg" weight="extraBold" letterSpacing={-0.4} textAlign="center">
        {p.titulo}
      </MText>
      <MText size="md" weight="semibold" color={colors.gray600} textAlign="center">
        {p.cuerpo}
      </MText>
    </View>
  );
}

/** Nothing has left the drawer yet: Don, one sentence; the button is the foot's. */
export function SinGastos(): ReactElement {
  return (
    <EstadoVacio
      id="gastos-sin-gastos"
      title="No ha salido dinero de la caja"
      body="Cuando pagues algo del negocio con efectivo, regístralo aquí."
    />
  );
}

export function Lista(p: {
  readonly gastos: readonly GastoTurno[];
  /** «Agregar foto» on a row without its receipt (M-18); absent, no button. */
  readonly onAgregarFoto?: (g: GastoTurno) => void;
}): ReactElement {
  if (p.gastos.length === 0) {
    return (
      <Vacio
        titulo="Nada en esta categoría"
        cuerpo="Toca «Todos» para ver cada gasto de tu turno."
        testID="gastos-sin-resultados"
      />
    );
  }
  return (
    <QuietPanel label="Gastos" count={p.gastos.length} testID="gastos-lista">
      {p.gastos.map((g, i) => (
        <View
          key={g.id}
          borderTopWidth={i === 0 ? 0 : borderWidths.quiet}
          borderTopColor={colors.gray100}
        >
          <GastoFila
            x={g}
            {...(p.onAgregarFoto ? { onAgregarFoto: () => p.onAgregarFoto?.(g) } : {})}
          />
        </View>
      ))}
    </QuietPanel>
  );
}

/** The due recurring gastos, newest due first is the caller's order. */
export function Pendientes(p: {
  readonly items: readonly RecurrentePorPagar[];
  readonly onPagar: (x: RecurrentePorPagar) => void;
}): ReactElement {
  return (
    <QuietPanel
      label="Pendientes de registrar"
      count={p.items.length}
      note="Gastos que se repiten y ya tocan"
      testID="gastos-pendientes"
    >
      {p.items.map((x, i) => (
        <View
          key={x.para.id}
          borderTopWidth={i === 0 ? 0 : borderWidths.quiet}
          borderTopColor={colors.gray100}
        >
          <PendienteFila x={x} onPagar={() => p.onPagar(x)} />
        </View>
      ))}
    </QuietPanel>
  );
}
