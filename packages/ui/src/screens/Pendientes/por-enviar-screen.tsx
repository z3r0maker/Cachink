/**
 * PorEnviarScreen — «Registros por enviar» (Track M, M-09; the board
 * `Operador Pendientes` said on the phone): the local queue's face, not only
 * its rejections. The hero says which phase the queue is in (en espera, sin
 * internet, enviando, todo enviado, con rechazados) and retries the whole
 * flush; «La cola» lists what waits; «El servidor no aceptó» shows what the
 * server refused, each with its sentence. Presentational: the route hands
 * it `usePorEnviar()`.
 */
import type { ReactElement } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import type { Fase, RegistroEnCola } from '@xangarro/caja/pendientes';
import {
  heroeTelefono,
  intro,
  NOTA_NADA_SE_PIERDE,
  portalDe,
  type FaseCola,
  type HeroeCola,
  type RechazoVisto,
} from '@xangarro/caja/pendientes';
import { MText } from '../../components/Mostrador/index';
import { GLYPHS } from '../../components/PathIcon/glyphs';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, colors, radii, shapeRadii } from '../../theme';
import { ColaPanel } from './cola-panel';
import { EstadosCaja } from './estados';
import { RechazadosPanel } from './rechazados-panel';

export interface PorEnviarScreenProps {
  readonly state: 'happy' | 'cargando' | 'sin-internet' | 'error';
  readonly fase: FaseCola;
  readonly cola: readonly RegistroEnCola[];
  readonly rechazados: readonly RechazoVisto[];
  /** The owner's first name; null says «el portal del dueño». */
  readonly dueno?: string | null;
  /** "HH:MM" of the last run that reached the server. */
  readonly ultima?: string | null;
  /** The manual flush: what the pill's «Actualizar» runs. */
  readonly onReintentar: () => void;
  /** Requeues refused rows, then flushes. */
  readonly onReintentarRechazado: (xs: readonly RechazoVisto[]) => void;
  readonly onIrACierre: () => void;
  readonly onRetry: () => void;
  readonly testID?: string;
}

const SIN_INTERNET = 'sin-internet' as const;

const TINTES: Record<FaseCola, { readonly fondo: string; readonly texto: string }> = {
  espera: { fondo: colors.warningSoft, texto: colors.warningText },
  'sin-internet': { fondo: colors.warningSoft, texto: colors.warningText },
  enviando: { fondo: colors.blueSoft, texto: colors.blueText },
  enviado: { fondo: colors.greenSoft, texto: colors.greenText },
  'con-rechazados': { fondo: colors.redSoft, texto: colors.redText },
};

function HeroeCabeza(p: { readonly fase: FaseCola; readonly h: HeroeCola }): ReactElement {
  const tono = TINTES[p.fase];
  return (
    <View flexDirection="row" alignItems="center" gap={10}>
      <View
        width={44}
        height={44}
        alignItems="center"
        justifyContent="center"
        borderRadius={shapeRadii.pill}
        backgroundColor={tono.fondo}
      >
        <PathIcon
          d={p.fase === 'enviado' ? GLYPHS.check : GLYPHS.nube}
          size={20}
          strokeWidth={2.4}
          color={tono.texto}
        />
      </View>
      <View gap={1} flex={1}>
        <MText size="xs" weight="extraBold" color={tono.texto}>
          {p.h.eyebrow}
        </MText>
        <MText size="lg" weight="extraBold">
          {p.h.titulo}
        </MText>
      </View>
    </View>
  );
}

function Heroe(p: PorEnviarScreenProps & { readonly fase: FaseCola }): ReactElement {
  const h = heroeTelefono(p.fase, p.cola, p.rechazados.length, p.ultima ?? null);
  const enviando = p.fase === 'enviando';
  return (
    <View
      testID="por-enviar-heroe"
      role="status"
      gap={10}
      padding={16}
      borderRadius={radii[4]}
      borderWidth={borderWidths.quiet}
      backgroundColor={colors.white}
    >
      <HeroeCabeza fase={p.fase} h={h} />
      <MText size="sm" weight="semibold" color={colors.gray600} lineHeight={19}>
        {h.cuerpo}
      </MText>
      <Pressable
        testID="por-enviar-reintentar"
        role="button"
        accessibilityLabel={h.boton}
        aria-disabled={enviando}
        onPress={enviando ? undefined : p.onReintentar}
        style={{
          paddingVertical: 14,
          alignItems: 'center',
          borderRadius: radii[2],
          borderWidth: borderWidths.thin,
          borderColor: colors.black,
          backgroundColor: enviando ? colors.gray100 : colors.yellow,
          opacity: enviando ? 0.7 : 1,
        }}
      >
        <MText size="md" weight="extraBold">
          {h.boton}
        </MText>
      </Pressable>
    </View>
  );
}

function NadaSePierde(): ReactElement {
  return (
    <View testID="por-enviar-nota" padding={16} gap={6} alignItems="center">
      <MText size="sm" weight="extraBold">
        {NOTA_NADA_SE_PIERDE.titulo}
      </MText>
      <MText size="xs" weight="semibold" color={colors.gray600} textAlign="center" lineHeight={17}>
        {NOTA_NADA_SE_PIERDE.cuerpo}
      </MText>
    </View>
  );
}

function Cabeza(p: { readonly vacia: boolean; readonly dueno: string | null }): ReactElement {
  return (
    <View gap={2}>
      <MText size="xl4" weight="extraBold" letterSpacing={-0.9} role="heading">
        Registros por enviar
      </MText>
      <MText size="md" weight="semibold" color={colors.gray600}>
        {intro(p.vacia, p.dueno)}
      </MText>
    </View>
  );
}

/** The queue with data: hero, cola, refusals and the note. */
function ConDatos(p: PorEnviarScreenProps): ReactElement {
  const dueno = p.dueno === undefined ? 'Pedro' : p.dueno;
  const offline = p.state === SIN_INTERNET || p.fase === SIN_INTERNET;
  const faseFila: Fase = p.fase === 'enviando' ? 'enviando' : 'espera';
  const faseHeroe = p.state === SIN_INTERNET ? SIN_INTERNET : p.fase;
  return (
    <>
      <Heroe {...p} dueno={dueno} fase={faseHeroe} />
      <ColaPanel
        cola={p.cola}
        fase={faseFila}
        offline={offline}
        portal={portalDe(dueno)}
        onIrACierre={p.onIrACierre}
      />
      {p.rechazados.length > 0 ? (
        <RechazadosPanel rechazados={p.rechazados} onReintentar={p.onReintentarRechazado} />
      ) : null}
      <NadaSePierde />
    </>
  );
}

export function PorEnviarScreen(p: PorEnviarScreenProps): ReactElement {
  const vacia = p.cola.length === 0 && p.rechazados.length === 0;
  const base = p.testID ?? 'por-enviar';
  return (
    <ScrollView testID={base} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Cabeza vacia={vacia} dueno={p.dueno ?? null} />
      {p.state === 'happy' || p.state === SIN_INTERNET ? (
        <ConDatos {...p} />
      ) : p.state === 'cargando' ? (
        <EstadosCaja id="cargando" titulo="Leyendo la cola de esta caja…" testID={base} />
      ) : (
        <EstadosCaja
          id="falla"
          titulo="No pudimos leer la cola de esta caja"
          cuerpo="Nada se pierde: sigue todo guardado aquí. Vuelve a intentar en un momento."
          onRetry={p.onRetry}
          testID={base}
        />
      )}
    </ScrollView>
  );
}
