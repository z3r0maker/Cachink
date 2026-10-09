/**
 * GastosScreen — «Gastos del turno» (Track M, M-08; the web operador's
 * `GastosScreen` said on the phone): what left the drawer in this turno,
 * its three figures, the search and the category chips, the recurring gastos
 * already due and the two sheets that record — «Registrar gasto» empty, or
 * «Pagar» one filled from a due template. Presentational: the route hands it
 * `useGastos()`, the retry and, when Inicio's «Para hoy» sent one, the
 * prefill to open the pagar sheet with.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import {
  filtrar,
  type CategoriaGasto,
  type GastosData,
  type NuevoGasto,
  type PrefillGasto,
  type RecurrentePorPagar,
} from '@xangarro/caja/gastos';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { ErrorState, Spinner } from '../../components/index';
import { colors } from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';
import { Buscador, Cifras, Filtros } from './gastos-cifras';
import { Lista, Pendientes } from './gastos-lista';
import { PagarRecurrenteSheet } from './pagar-recurrente-sheet';
import { RegistrarGastoSheet } from './registrar-gasto-sheet';

export interface GastosScreenProps {
  readonly state: 'loading' | 'error' | 'happy';
  readonly data: GastosData | null;
  /** The due recurring gastos to pay; null while the read lands. */
  readonly porPagar: readonly RecurrentePorPagar[] | null;
  /** A due recurring gasto Inicio's «Para hoy» sent: the pagar sheet opens on it. */
  readonly prefill?: PrefillGasto | null;
  /** The write behind both sheets (`useGastos().registrar`). */
  readonly registrar: (n: NuevoGasto) => Promise<void>;
  readonly onRetry: () => void;
  readonly testID?: string;
}

type Hoja =
  | { readonly kind: 'registrar' }
  | { readonly kind: 'pagar'; readonly x: RecurrentePorPagar };

/** The sheets: a due template to pay opens itself, as the web's cajón does. */
function useHoja(
  prefill: PrefillGasto | null,
  porPagar: readonly RecurrentePorPagar[] | null,
): { readonly hoja: Hoja | null; readonly abrir: (h: Hoja) => void; readonly cerrar: () => void } {
  const [hoja, setHoja] = useState<Hoja | null>(null);
  useEffect(() => {
    if (prefill === null) return;
    const x = (porPagar ?? []).find((p) => p.prefill.recurrenteId === prefill.recurrenteId);
    if (x !== undefined) setHoja({ kind: 'pagar', x });
  }, [prefill, porPagar]);
  return { hoja, abrir: setHoja, cerrar: () => setHoja(null) };
}

function Cabeza({ onRegistrar }: { readonly onRegistrar: () => void }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={12}>
      <View flex={1} gap={2}>
        <MText size="xl4" weight="extraBold" letterSpacing={-0.9} role="heading">
          Gastos
        </MText>
        <MText size="md" weight="semibold" color={colors.gray600}>
          Lo que salió de la caja en tu turno
        </MText>
      </View>
      <Btn
        variant="primary"
        size="lg"
        sentence
        icon={<PathIcon d={COBRAR_GLYPHS.mas} size={18} strokeWidth={2.6} />}
        onPress={onRegistrar}
        testID="gastos-abrir-registrar"
      >
        Registrar gasto
      </Btn>
    </View>
  );
}

function Contenido(p: GastosScreenProps & { readonly data: GastosData }): ReactElement {
  const [filtro, setFiltro] = useState<'Todos' | CategoriaGasto>('Todos');
  const [query, setQuery] = useState('');
  const { hoja, abrir, cerrar } = useHoja(p.prefill ?? null, p.porPagar);
  const firma = `${p.data.operador}, ${p.data.caja}`;
  const visibles = filtrar(p.data.gastos, filtro, query);
  return (
    <>
      <ScrollView
        testID={p.testID ?? 'gastos'}
        contentContainerStyle={{ padding: 16, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        <Cabeza onRegistrar={() => abrir({ kind: 'registrar' })} />
        <Cifras data={p.data} />
        <Buscador q={query} onQ={setQuery} />
        <Filtros valor={filtro} onElegir={setFiltro} />
        {p.porPagar !== null && p.porPagar.length > 0 ? (
          <Pendientes items={p.porPagar} onPagar={(x) => abrir({ kind: 'pagar', x })} />
        ) : null}
        <Lista gastos={visibles} buscando={query.trim() !== ''} />
      </ScrollView>
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
    </>
  );
}

export function GastosScreen(p: GastosScreenProps): ReactElement {
  // The route's identity testID rides every state — flows assert the
  // screen, not whichever branch the data left it in.
  if (p.state === 'error' || (p.state === 'happy' && p.data === null)) {
    return (
      <View flex={1} testID={p.testID}>
        <ErrorState
          title="No pudimos cargar tus gastos"
          body="Lo que salió de tu caja sigue guardado. Intenta otra vez."
          retryLabel="Intentar otra vez"
          onRetry={p.onRetry}
          testID="gastos-error"
        />
      </View>
    );
  }
  if (p.data === null) {
    return (
      <View flex={1} testID={p.testID}>
        <View flex={1} alignItems="center" justifyContent="center" testID="gastos-cargando">
          <Spinner />
        </View>
      </View>
    );
  }
  return <Contenido {...p} data={p.data} />;
}
