/**
 * AccesoScreen — «¿Quién va a cobrar?» (MvAcceso; the web caja's `nip.tsx`).
 * Don greets whoever is picked, the operators the owner created come as
 * radio rows, and four digits on the keypad open the caja. Full screen: no
 * header, no tab bar.
 *
 * Presentational: the gate hands it the operators, the session's caja and
 * date, and checks the NIP (`useQuickSwitchAuth`, the device-wide cooldown).
 * The root keeps the `quick-switch` testID the Maestro flows wait for.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import type { UserId } from '@xangarro/domain';
import { Eyebrow, MText, SafeAreaSpacer } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import { CabezaDon, CajaChip, OlvideNip, OperadorFila, type AccesoOperador } from './acceso-partes';
import { primerNombreDe, teclearNip, type TeclaNip } from './nip';
import { NipPad } from './nip-pad';

export interface AccesoScreenProps {
  readonly operadores: readonly AccesoOperador[];
  /** «Caja 1 · Taquería Don Pedro», from the session; null hides the chip. */
  readonly contexto: string | null;
  /** «Jueves 14 de mayo». */
  readonly fecha: string;
  /** The owner's first name, or null («al dueño»). */
  readonly dueno: string | null;
  readonly onAuthenticate: (userId: UserId, pin: string) => void;
  readonly error: string | null;
  readonly submitting: boolean;
  readonly testID?: string;
}

/** Whoever holds the open turno, or the only operator, starts picked. */
export function preseleccion(ops: readonly AccesoOperador[]): string | null {
  const conTurno = ops.find((o) => o.detalle !== undefined);
  if (conTurno) return conTurno.id;
  return ops.length === 1 ? (ops[0]?.id ?? null) : null;
}

function useAcceso(props: AccesoScreenProps) {
  const [elegido, setElegido] = useState<string | null>(() => preseleccion(props.operadores));
  const [nip, setNip] = useState('');
  // A wrong NIP empties the dots for the next try.
  useEffect(() => {
    if (props.error !== null) setNip('');
  }, [props.error]);
  return {
    elegido,
    nip,
    elegir: (id: string) => {
      setElegido(id);
      setNip('');
    },
    teclear: (t: TeclaNip) => setNip((n) => teclearNip(n, t)),
    enviar: () => {
      if (elegido !== null) props.onAuthenticate(elegido as UserId, nip);
    },
  };
}

function Encabezado(props: { fecha: string; contexto: string | null }): ReactElement {
  const { t } = useTranslation();
  return (
    <View gap={8}>
      <View flexDirection="row" alignItems="center" justifyContent="space-between" gap={8}>
        <View flexShrink={0}>
          <Eyebrow color={colors.gray600}>{props.fecha}</Eyebrow>
        </View>
        {props.contexto ? <CajaChip texto={props.contexto} /> : null}
      </View>
      <MText role="heading" aria-level={1} size="xl4" weight="extraBold" letterSpacing={-0.9}>
        {t('entrar.acceso.titulo')}
      </MText>
    </View>
  );
}

function TituloNip(): ReactElement {
  const { t } = useTranslation();
  return (
    <View flexDirection="row" alignItems="center" justifyContent="space-between">
      <MText size="body" weight="extraBold">
        {t('entrar.nip.titulo')}
      </MText>
      <MText size="sm" weight="semibold" color={colors.gray600}>
        {t('entrar.nip.cuatro')}
      </MText>
    </View>
  );
}

function SeccionNip(p: {
  a: ReturnType<typeof useAcceso>;
  submitting: boolean;
  error: string | null;
}): ReactElement {
  return (
    <View gap={10}>
      <TituloNip />
      <NipPad
        nip={p.a.nip}
        onTecla={p.a.teclear}
        onEnviar={p.a.enviar}
        accion="entrar"
        bloqueado={p.submitting}
        error={p.error}
      />
    </View>
  );
}

export function AccesoScreen(props: AccesoScreenProps): ReactElement {
  const { t } = useTranslation();
  const a = useAcceso(props);
  const actual = props.operadores.find((o) => o.id === a.elegido);
  const saludo = actual
    ? t('entrar.acceso.saludo', { nombre: primerNombreDe(actual.nombre) })
    : t('entrar.acceso.saludoSinNombre');
  return (
    <View testID={props.testID ?? 'quick-switch'} flex={1} backgroundColor={colors.gray200}>
      <View backgroundColor={colors.yellow}>
        <SafeAreaSpacer />
      </View>
      <CabezaDon texto={saludo} />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        <Encabezado fecha={props.fecha} contexto={props.contexto} />
        <View role="radiogroup" aria-label={t('entrar.acceso.titulo')} gap={6}>
          {props.operadores.map((o) => (
            <OperadorFila key={o.id} o={o} on={o.id === a.elegido} onPress={() => a.elegir(o.id)} />
          ))}
        </View>
        {actual ? <SeccionNip a={a} submitting={props.submitting} error={props.error} /> : null}
        <OlvideNip aQuien={props.dueno ? `a ${props.dueno}` : t('entrar.acceso.alDueno')} />
      </ScrollView>
    </View>
  );
}
