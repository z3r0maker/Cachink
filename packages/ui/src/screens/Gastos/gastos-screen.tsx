/**
 * GastosScreen — «Gastos del turno» (Track M, M-08; RvGastos): what left the
 * drawer in this turno, two figures, the receipt note and the category chips,
 * the recurring gastos already due, and one «Registrar gasto» fixed at the
 * foot. Nothing recorded yet is Don's empty state; no open turno is
 * MvTurnoCerrado, because a gasto saved there showed in no list (M8). The two
 * sheets record — «Registrar gasto» empty, or «Pagar» one filled from a due
 * template. Presentational: the route hands it `useGastos()`, the retry,
 * «Abrir turno» and, when Inicio's «Para hoy» sent one, the prefill.
 */
import { useState, type ReactElement, type ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import type { ComprobanteGasto } from '@xangarro/application';
import { formatMoney } from '@xangarro/domain';
import {
  filtrar,
  type CategoriaGasto,
  type GastosData,
  type GastoTurno,
  type NuevoGasto,
  type PrefillGasto,
  type RecurrentePorPagar,
} from '@xangarro/caja/gastos';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { CajaEstado, EstadoCargando } from '../../components/index';
import { borderColors, borderWidths, colors } from '../../theme';
import { TurnoCerrado } from '../AbrirTurno/turno-cerrado';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';
import { Cifras, Filtros } from './gastos-cifras';
import { Lista, Pendientes, SinGastos } from './gastos-lista';
import { PagarRecurrenteSheet } from './pagar-recurrente-sheet';
import { RegistrarGastoSheet } from './registrar-gasto-sheet';
import { useHoja } from './gastos-hoja';
import { FotosGasto } from '../../comprobante-gasto/fotos-gasto';
import type { AgregarFoto } from '../../comprobante-gasto/use-agregar-foto';

export interface GastosScreenProps {
  readonly state: 'loading' | 'error' | 'happy';
  readonly data: GastosData | null;
  /** False outside a turno: no form opens, only «Abrir turno» (M8). */
  readonly turnoAbierto: boolean;
  /** «Abrir turno»: the fondo sheet, right here (MvTurnoCerrado). */
  readonly onAbrirTurno: () => void;
  /** The due recurring gastos to pay; null while the read lands. */
  readonly porPagar: readonly RecurrentePorPagar[] | null;
  /** A due recurring gasto Inicio's «Para hoy» sent: the pagar sheet opens on it. */
  readonly prefill?: PrefillGasto | null;
  /** The write behind both sheets (`useGastos().registrar`). */
  readonly registrar: (n: NuevoGasto, comprobante?: ComprobanteGasto | null) => Promise<void>;
  readonly onRetry: () => void;
  /** «Agregar foto» on a saved gasto (`useAgregarFoto`); absent where there is no camera. */
  readonly fotos?: AgregarFoto;
  readonly testID?: string;
}

/** A row's «Agregar foto»: the camera, titled «Tortillas · $180.00». */
const agregar = (f: AgregarFoto) => (g: GastoTurno) =>
  f.abrir(g.id, `${g.concepto} · ${formatMoney(g.monto)}`);

function Cabeza(): ReactElement {
  return (
    <View gap={2}>
      <MText size="xl4" weight="extraBold" letterSpacing={-0.9} role="heading">
        Gastos
      </MText>
      <MText size="md" weight="semibold" color={colors.gray600}>
        Lo que salió de la caja en tu turno
      </MText>
    </View>
  );
}

/** The one way to record, fixed at the foot in every state with a turno. */
function Pie({ onRegistrar }: { readonly onRegistrar: () => void }): ReactElement {
  return (
    <View
      padding={16}
      borderTopWidth={borderWidths.quiet}
      borderTopColor={borderColors.quiet}
      backgroundColor={colors.white}
    >
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        icon={<PathIcon d={COBRAR_GLYPHS.mas} size={20} strokeWidth={2.6} />}
        onPress={onRegistrar}
        testID="gastos-abrir-registrar"
      >
        Registrar gasto
      </Btn>
    </View>
  );
}

/** The figures, the chips and the rows; Don alone when nothing left the drawer. */
function Cuerpo(p: {
  readonly data: GastosData;
  readonly pendientes: ReactNode;
  readonly fotos: AgregarFoto | undefined;
}): ReactElement {
  const [filtro, setFiltro] = useState<'Todos' | CategoriaGasto>('Todos');
  if (p.data.gastos.length === 0) {
    return (
      <>
        {p.pendientes}
        <SinGastos />
      </>
    );
  }
  return (
    <>
      <Cifras data={p.data} />
      <Filtros valor={filtro} onElegir={setFiltro} />
      {p.pendientes}
      <Lista
        gastos={filtrar(p.data.gastos, filtro, '')}
        {...(p.fotos?.disponible === true ? { onAgregarFoto: agregar(p.fotos) } : {})}
      />
    </>
  );
}

function Contenido(p: GastosScreenProps & { readonly data: GastosData }): ReactElement {
  const { hoja, abrir, cerrar } = useHoja(p.prefill ?? null, p.porPagar);
  const firma = `${p.data.operador}, ${p.data.caja}`;
  return (
    <View flex={1}>
      <ScrollView
        testID={p.testID ?? 'gastos'}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        <Cabeza />
        <Cuerpo
          data={p.data}
          fotos={p.fotos}
          pendientes={
            p.porPagar !== null && p.porPagar.length > 0 ? (
              <Pendientes items={p.porPagar} onPagar={(x) => abrir({ kind: 'pagar', x })} />
            ) : null
          }
        />
      </ScrollView>
      <Pie onRegistrar={() => abrir({ kind: 'registrar' })} />
      {p.fotos === undefined ? null : <FotosGasto f={p.fotos} />}
      {hoja === null ? null : hoja.kind === 'registrar' ? (
        <RegistrarGastoSheet open firma={firma} onClose={cerrar} onGuardar={p.registrar} />
      ) : (
        <PagarRecurrenteSheet
          open
          x={hoja.x}
          firma={firma}
          onClose={cerrar}
          onGuardar={p.registrar}
        />
      )}
    </View>
  );
}

export function GastosScreen(p: GastosScreenProps): ReactElement {
  // The route's identity testID rides every state — flows assert the
  // screen, not whichever branch the data left it in.
  if (p.state === 'error' || (p.state === 'happy' && p.data === null)) {
    return (
      <View flex={1} testID={p.testID}>
        <CajaEstado
          mode="error"
          errorTitle="No pudimos cargar tus gastos"
          onRetry={p.onRetry}
          testID="gastos"
        />
      </View>
    );
  }
  if (p.data === null) {
    return (
      <View flex={1} testID={p.testID}>
        <EstadoCargando testID="gastos-cargando" />
      </View>
    );
  }
  if (!p.turnoAbierto) {
    return (
      <View flex={1} testID={p.testID}>
        <TurnoCerrado pantalla="gastos" onAbrir={p.onAbrirTurno} testID="gastos-sin-turno" />
      </View>
    );
  }
  return <Contenido {...p} data={p.data} />;
}
