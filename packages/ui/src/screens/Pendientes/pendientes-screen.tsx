/**
 * Registros por enviar (MvPendientes, the web's OpPendientes; M-09): what
 * this caja captured and the server has not accepted yet. The hero says how
 * many wait and what they add up to, «La cola» lists them in the order they
 * leave, the refused ones follow with their retry, and Don Cuentas says that
 * nothing is lost. «Reintentar ahora» sits in the thumb zone. With nothing
 * waiting the hero turns green: «Todo enviado».
 */
import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import type { Reintento } from '@xangarro/caja';
import { heroe, intro, type Fase, type RegistroEnCola } from '@xangarro/caja/pendientes';
import type { RejectedRow } from '@xangarro/sync';
import { Btn, CajaEstado, Don, GLYPHS, MText, PathIcon } from '../../components/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { PendientesHeroe } from './pendientes-heroe';
import { ListaCola } from './pendientes-lista';
import { RechazadosLista } from './rechazados-lista';

export interface PendientesScreenProps {
  readonly state: 'loading' | 'error' | 'happy';
  readonly cola: readonly RegistroEnCola[];
  readonly rechazados: readonly RejectedRow[];
  readonly fase: Fase;
  readonly offline: boolean;
  /** A retry ran and the caja is still offline. */
  readonly sinInternet: boolean;
  /** The engine's wait after a failed run, while it still lies ahead (DS-05). */
  readonly reintento?: Reintento | null;
  /** The clock the countdowns read. */
  readonly ahora?: number;
  /** «Reintentar envío» ran and the engine still waits. */
  readonly intentado?: boolean;
  readonly onReintentar: () => void;
  readonly onReintentarRechazados: (rows: readonly RejectedRow[]) => void;
  readonly onRetryLeer: () => void;
}

function NadaSePierde(): ReactElement {
  return (
    <View
      role="region"
      aria-label="Nada se pierde"
      flexDirection="row"
      alignItems="center"
      gap={10}
    >
      <Don pose="ayuda" size={76} />
      <View
        flex={1}
        gap={4}
        paddingHorizontal={14}
        paddingVertical={12}
        borderRadius={radii[4]}
        borderWidth={borderWidths.thin}
        borderColor={colors.black}
        backgroundColor={colors.yellowSoft}
      >
        <MText size="body" weight="extraBold">
          Nada se pierde
        </MText>
        <MText size="sm" weight="semibold" color={colors.ink} lineHeight={19}>
          Lo que capturas vive en esta caja hasta que suba. No borres los datos de la app. Puedes
          cerrar el turno; se envían cuando vuelva la conexión.
        </MText>
      </View>
    </View>
  );
}

function Pie(p: PendientesScreenProps): ReactElement {
  const enviando = p.fase === 'enviando';
  const label = enviando ? 'Enviando…' : heroe(p.fase, p.cola, p.cola.length).boton;
  return (
    <View
      paddingHorizontal={16}
      paddingVertical={12}
      backgroundColor={colors.gray200}
      borderTopWidth={borderWidths.quiet}
      borderTopColor={borderColors.quiet}
    >
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        disabled={enviando}
        onPress={p.onReintentar}
        icon={<PathIcon d={GLYPHS.nube} size={20} strokeWidth={2.4} />}
        testID="pendientes-reintentar"
      >
        {label}
      </Btn>
    </View>
  );
}

/** The hero, «La cola» and the refused rows, once the queue is read. */
function Contenido(p: PendientesScreenProps): ReactElement {
  return (
    <>
      <PendientesHeroe
        fase={p.fase}
        cola={p.cola}
        sinInternet={p.sinInternet}
        reintento={p.reintento ?? null}
        intentado={p.intentado ?? false}
      />
      {p.cola.length === 0 ? null : (
        <ListaCola
          cola={p.cola}
          fase={p.fase}
          offline={p.offline}
          ahora={p.ahora ?? Date.now()}
          reintento={p.reintento ?? null}
        />
      )}
      <RechazadosLista rows={p.rechazados} onRetry={p.onReintentarRechazados} />
    </>
  );
}

export function PendientesScreen(p: PendientesScreenProps): ReactElement {
  const vacia = p.cola.length === 0;
  return (
    <View flex={1} testID="pendientes">
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 14, gap: 14 }}>
        <View gap={2}>
          <MText size="xl4" weight="extraBold" letterSpacing={-0.9} role="heading">
            Registros por enviar
          </MText>
          <MText size="md" weight="semibold" color={colors.gray600}>
            {intro(vacia && p.state === 'happy', null)}
          </MText>
        </View>
        {p.state === 'happy' ? (
          <Contenido {...p} />
        ) : (
          <CajaEstado
            mode={p.state}
            errorTitle="No pudimos leer la cola de esta caja"
            onRetry={p.onRetryLeer}
            testID="pendientes"
          />
        )}
        <NadaSePierde />
      </ScrollView>
      {p.state === 'happy' ? <Pie {...p} /> : null}
    </View>
  );
}
