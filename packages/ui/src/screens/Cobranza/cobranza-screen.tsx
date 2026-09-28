/**
 * Fiado y abonos (MvCobranza, the web's OpCobranza): who owes the business.
 * The three figures (por cobrar, today's abonos, of them in cash), a search
 * by name or phone, the Todos / Con saldo / Atrasados chips and one row per
 * client; a row opens the account. Every figure is `@xangarro/caja/cobranza`
 * over the phone's own rows, as the web says them.
 */
import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import { filtrar, type CuentaCliente, type FiltroCobranza } from '@xangarro/caja/cobranza';
import { Chip, ErrorState, MText, Spinner } from '../../components/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { CobranzaFila } from './cobranza-fila';
import { Buscador, Resumen } from './cobranza-resumen';

export interface CobranzaScreenProps {
  readonly state: 'loading' | 'error' | 'happy';
  readonly cuentas: readonly CuentaCliente[];
  /** The day abonos count as «hoy» (`YYYY-MM-DD`). */
  readonly hoy: string;
  readonly onAbrir: (clienteId: string) => void;
  readonly onRetry: () => void;
}

const FILTROS: readonly FiltroCobranza[] = ['Todos', 'Con saldo', 'Atrasados'];

function Lista(p: CobranzaScreenProps & { filtro: FiltroCobranza; q: string }): ReactElement {
  const filas = filtrar(p.cuentas, p.filtro, p.q);
  const vacio =
    p.cuentas.length === 0 ? 'Todavía no le fías a nadie.' : 'No hay clientes con ese filtro.';
  return (
    <View
      role="list"
      aria-label="Clientes"
      borderRadius={radii[6]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.white}
      overflow="hidden"
    >
      {filas.map((c, i) => (
        <CobranzaFila
          key={c.id}
          c={c}
          hoy={p.hoy}
          ultima={i === filas.length - 1}
          onPress={() => p.onAbrir(c.id)}
        />
      ))}
      {filas.length === 0 ? (
        <MText
          testID="cobranza-vacio"
          size="body"
          weight="bold"
          color={colors.gray600}
          textAlign="center"
          padding={32}
        >
          {vacio}
        </MText>
      ) : null}
    </View>
  );
}

function Cabeza(p: { children: ReactElement }): ReactElement {
  return (
    <View paddingHorizontal={16} paddingTop={14} paddingBottom={6} gap={10}>
      <View flexDirection="row" alignItems="baseline" gap={10}>
        <MText size="xl4" weight="extraBold" letterSpacing={-0.9} role="heading">
          Fiado y abonos
        </MText>
        <MText size="md" weight="semibold" color={colors.gray600}>
          Quién te debe
        </MText>
      </View>
      {p.children}
    </View>
  );
}

function Estado(p: CobranzaScreenProps): ReactElement {
  if (p.state === 'error') {
    return (
      <ErrorState
        title="No pudimos leer las cuentas"
        body="Tus clientes y sus abonos siguen guardados en esta caja. Vuelve a intentarlo."
        retryLabel="Reintentar"
        onRetry={p.onRetry}
        testID="cobranza-error"
      />
    );
  }
  return (
    <View flex={1} alignItems="center" justifyContent="center" testID="cobranza-cargando">
      <Spinner />
    </View>
  );
}

export function CobranzaScreen(p: CobranzaScreenProps): ReactElement {
  const [filtro, setFiltro] = useState<FiltroCobranza>('Todos');
  const [q, setQ] = useState('');
  if (p.state !== 'happy') return <Estado {...p} />;
  return (
    <View flex={1} testID="cobranza">
      <Cabeza>
        <View gap={10}>
          <Resumen cuentas={p.cuentas} hoy={p.hoy} />
          <Buscador q={q} onQ={setQ} />
        </View>
      </Cabeza>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        role="radiogroup"
        aria-label="Filtrar clientes"
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10 }}
      >
        {FILTROS.map((f) => (
          <Chip
            key={f}
            label={f}
            selected={filtro === f}
            onPress={() => setFiltro(f)}
            testID={`cobranza-filtro-${f}`}
          />
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <Lista {...p} filtro={filtro} q={q} />
      </ScrollView>
    </View>
  );
}
