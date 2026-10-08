/**
 * Avisos (MvAvisos, the web's OpAvisos; M-09): «De Pedro», what the owner
 * wrote to this operator (read it, mark it read, answer a request to clear up
 * a corte), and «De tu caja», what the caja itself flags (low stock, records
 * not sent yet or refused, fiado running late), each with the button to the
 * screen that deals with it. «Todo leído» marks everything read.
 */
import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import {
  deDueno,
  mayuscula,
  type Aviso,
  type AvisoGrupo,
  type AvisosData,
} from '@xangarro/caja/avisos';
import { Btn, CajaEstado, GLYPHS, MText, PathIcon, SegmentedTabs } from '../../components/index';
import { colors } from '../../theme';
import { AvisoDueno } from './aviso-dueno';
import { AvisoSistema } from './aviso-sistema';

export interface AvisosScreenProps {
  readonly state: 'loading' | 'error' | 'empty' | 'happy';
  readonly data: AvisosData;
  readonly tabInicial?: AvisoGrupo;
  readonly onMarcar: (ids: readonly string[]) => void;
  readonly onResponder: (mensajeId: string, texto: string) => Promise<void>;
  /** The phone route for a notice's href (`/operador/inventario` → `/inventario`). */
  readonly rutaDe: (href: string) => string | null;
  readonly onIr: (ruta: string) => void;
  readonly onRetry: () => void;
}

const LISTA = { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 18, gap: 14 } as const;

function useRespuestas(onResponder: AvisosScreenProps['onResponder']) {
  const [drafts, setDrafts] = useState<Readonly<Record<string, string>>>({});
  const [enviando, setEnviando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const enviar = (id: string): void => {
    setEnviando(id);
    setError(null);
    onResponder(id, drafts[id] ?? '').then(
      () => {
        setEnviando(null);
        setDrafts((d) => ({ ...d, [id]: '' }));
      },
      () => {
        setEnviando(null);
        setError(id);
      },
    );
  };
  const draft = (id: string, t: string) => setDrafts((d) => ({ ...d, [id]: t }));
  return { drafts, enviando, error, enviar, draft };
}

function Cabeza(p: { dueno: string; sinLeer: readonly Aviso[]; onTodo: () => void }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={10}>
      <View flex={1} minWidth={0}>
        <MText size="xl4" weight="extraBold" letterSpacing={-0.9} role="heading">
          Avisos
        </MText>
        <MText size="md" weight="semibold" color={colors.gray600}>
          {`Lo que te manda ${p.dueno} y lo que la caja te avisa`}
        </MText>
      </View>
      {p.sinLeer.length > 0 ? (
        <Btn
          variant="quiet"
          size="md"
          sentence
          onPress={p.onTodo}
          ariaLabel="Marcar todo como leído"
          icon={<PathIcon d={GLYPHS.check} size={18} strokeWidth={2.2} />}
          testID="avisos-todo-leido"
        >
          Todo leído
        </Btn>
      ) : null}
    </View>
  );
}

function Vacio({ texto }: { texto: string }): ReactElement {
  return (
    <MText
      testID="avisos-vacio"
      size="body"
      weight="bold"
      color={colors.gray600}
      textAlign="center"
      padding={32}
    >
      {texto}
    </MText>
  );
}

const conCuenta = (label: string, n: number): string => (n > 0 ? `${label} · ${n}` : label);

function Arriba(p: {
  data: AvisosData;
  tab: AvisoGrupo;
  onTab: (t: AvisoGrupo) => void;
  onMarcar: (ids: readonly string[]) => void;
}): ReactElement {
  const { dueno, avisos } = p.data;
  const sinLeer = avisos.filter((x) => !x.leido);
  const cuenta = (g: AvisoGrupo) => sinLeer.filter((x) => x.grupo === g).length;
  return (
    <View paddingHorizontal={16} paddingTop={14} paddingBottom={8} gap={10}>
      <Cabeza dueno={dueno} sinLeer={sinLeer} onTodo={() => p.onMarcar(sinLeer.map((x) => x.id))} />
      <SegmentedTabs
        ariaLabel="Quién avisa"
        value={p.tab}
        onChange={p.onTab}
        tabs={[
          { key: 'dueno', label: conCuenta(mayuscula(deDueno(dueno)), cuenta('dueno')) },
          { key: 'caja', label: conCuenta('De tu caja', cuenta('caja')) },
        ]}
        testID="avisos-tabs"
      />
    </View>
  );
}

function Tarjeta(p: {
  x: Aviso;
  hero: boolean;
  s: AvisosScreenProps;
  r: ReturnType<typeof useRespuestas>;
}): ReactElement {
  const { x, s, r } = p;
  if (x.grupo === 'caja') {
    return (
      <AvisoSistema
        aviso={x}
        ruta={x.cta ? s.rutaDe(x.cta.href) : null}
        onIr={(ruta) => {
          if (!x.leido) s.onMarcar([x.id]);
          s.onIr(ruta);
        }}
      />
    );
  }
  return (
    <AvisoDueno
      aviso={x}
      dueno={s.data.dueno}
      hero={p.hero}
      draft={r.drafts[x.id] ?? ''}
      enviando={r.enviando === x.id}
      error={r.error === x.id}
      onDraft={(t) => r.draft(x.id, t)}
      onSend={() => r.enviar(x.id)}
      onRead={() => s.onMarcar([x.id])}
    />
  );
}

export function AvisosScreen(p: AvisosScreenProps): ReactElement {
  const [tab, setTab] = useState<AvisoGrupo>(p.tabInicial ?? 'dueno');
  const r = useRespuestas(p.onResponder);
  if (p.state === 'loading' || p.state === 'error') {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <CajaEstado
          mode={p.state}
          errorTitle="No pudimos leer tus avisos"
          onRetry={p.onRetry}
          testID="avisos"
        />
      </ScrollView>
    );
  }
  const visibles = p.data.avisos.filter((x) => x.grupo === tab);
  const hero = visibles.find((x) => x.responder !== undefined && !x.respuesta)?.id;
  const vacio =
    tab === 'dueno'
      ? `Sin mensajes ${deDueno(p.data.dueno)} por ahora.`
      : 'Tu caja no tiene nada que avisarte.';
  return (
    <View flex={1} testID="avisos">
      <Arriba data={p.data} tab={tab} onTab={setTab} onMarcar={p.onMarcar} />
      <ScrollView contentContainerStyle={LISTA} keyboardShouldPersistTaps="handled">
        {visibles.length === 0 ? <Vacio texto={vacio} /> : null}
        {visibles.map((x) => (
          <Tarjeta key={x.id} x={x} hero={x.id === hero} s={p} r={r} />
        ))}
      </ScrollView>
    </View>
  );
}
