/**
 * NipPad — the four dots and the 3 × 4 keypad of MvAcceso and MvBloqueo:
 * 1 to 9, «Borrar», 0, and the key that sends («Entrar» or «Desbloquear»),
 * yellow only once the four digits are in. The keys keep the `numpad-<n>`
 * testIDs the Maestro sign-in subflow taps.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { MText, PathIcon } from '../../components/index';
import { Tecla } from '../../components/Teclado/index';
import { useTranslation } from '../../i18n/index';
import { borderWidths, colors, radii, shapeRadii } from '../../theme';
import { PIN_LENGTH } from '@xangarro/domain';
import { nipCompleto, type TeclaNip } from './nip';

const BORRAR =
  'M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zM12 9l6 6M18 9l-6 6';
const FLECHA = 'M5 12h14M12 5l7 7-7 7';
const FILAS: readonly (readonly TeclaNip[])[] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

export interface NipPadProps {
  readonly nip: string;
  readonly onTecla: (t: TeclaNip) => void;
  readonly onEnviar: () => void;
  readonly accion: 'entrar' | 'desbloquear';
  /** 58 px keys on Acceso, 66 on Bloqueo. */
  readonly grande?: boolean;
  readonly bloqueado?: boolean;
  readonly error?: string | null;
}

function Puntos({ n, grande }: { n: number; grande: boolean }): ReactElement {
  const { t } = useTranslation();
  const lado = grande ? 22 : 20;
  return (
    <View
      role="img"
      aria-label={t('entrar.nip.aria', { n })}
      flexDirection="row"
      justifyContent="center"
      gap={18}
      height={28}
      alignItems="center"
      testID="nip-puntos"
    >
      {Array.from({ length: PIN_LENGTH }, (_, i) => (
        <View
          key={i}
          width={lado}
          height={lado}
          borderRadius={shapeRadii.pill}
          borderWidth={borderWidths.thick}
          borderColor={colors.black}
          backgroundColor={i < n ? colors.black : colors.white}
        />
      ))}
    </View>
  );
}

function UltimaFila(p: NipPadProps & { alto: number }): ReactElement {
  const { t } = useTranslation();
  const listo = nipCompleto(p.nip) && p.bloqueado !== true;
  const verbo = p.accion === 'entrar' ? 'entrar' : 'desbloquear';
  return (
    <View flexDirection="row" gap={p.grande ? 10 : 8}>
      <Tecla
        label={t('entrar.nip.borrar')}
        ariaLabel={t('entrar.nip.borrarAria')}
        tono="suave"
        figura={false}
        height={p.alto}
        icon={<PathIcon d={BORRAR} size={20} strokeWidth={2} />}
        onPress={() => p.onTecla('borrar')}
        testID="nip-borrar"
      />
      <Tecla
        label="0"
        height={p.alto}
        onPress={() => p.onTecla('0')}
        testID="numpad-0"
        disabled={p.bloqueado}
      />
      <Tecla
        label={t(`entrar.nip.${verbo}`)}
        ariaLabel={listo ? undefined : t(`entrar.nip.${verbo}Falta`)}
        tono="accion"
        figura={false}
        height={p.alto}
        disabled={!listo}
        iconAfter
        icon={
          p.accion === 'entrar' ? <PathIcon d={FLECHA} size={18} strokeWidth={2.4} /> : undefined
        }
        onPress={p.onEnviar}
        testID="nip-enviar"
      />
    </View>
  );
}

/** On the gray page the red text sits on its soft ground, where it clears AA. */
function NipError({ texto }: { texto: string }): ReactElement {
  return (
    <View
      testID="nip-error"
      role="alert"
      paddingHorizontal={12}
      paddingVertical={10}
      borderRadius={radii[2]}
      borderWidth={borderWidths.thin}
      borderColor={colors.redText}
      backgroundColor={colors.redSoft}
    >
      <MText size="sm" weight="bold" color={colors.redText} textAlign="center">
        {texto}
      </MText>
    </View>
  );
}

export function NipPad(props: NipPadProps): ReactElement {
  const alto = props.grande ? 66 : 58;
  const gap = props.grande ? 10 : 8;
  return (
    <View gap={12} testID="nip-pad">
      <Puntos n={props.nip.length} grande={props.grande === true} />
      <View gap={gap}>
        {FILAS.map((fila) => (
          <View key={fila.join('')} flexDirection="row" gap={gap}>
            {fila.map((d) => (
              <Tecla
                key={d}
                label={d}
                height={alto}
                disabled={props.bloqueado}
                onPress={() => props.onTecla(d)}
                testID={`numpad-${d}`}
              />
            ))}
          </View>
        ))}
        <UltimaFila {...props} alto={alto} />
      </View>
      {props.error ? <NipError texto={props.error} /> : null}
    </View>
  );
}
