/**
 * MvAbrirTurno's amount: the big yellow-soft figure («$ 800.00 MXN»), the
 * four quick chips and the 3 × 4 keypad (1–9, the point, 0, «Borrar»). The
 * digit keys keep the `numpad-<n>` testIDs the Maestro subflow taps.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { Chip, Eyebrow, MText, PathIcon } from '../../components/index';
import { Tecla } from '../../components/Teclado/index';
import { useTranslation } from '../../i18n/index';
import { borderWidths, colors, radii, shadows } from '../../theme';
import { centavosDe, etiquetaRapido, fondoVisible, RAPIDOS, type TeclaFondo } from './fondo';

const BORRAR =
  'M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zM12 9l6 6M18 9l-6 6';
const FILAS: readonly (readonly TeclaFondo[])[] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'borrar'],
];

export function FondoCifra({ raw }: { raw: string }): ReactElement {
  const { t } = useTranslation();
  const vacio = raw === '';
  return (
    <View
      testID="abrir-numpad-display"
      role="status"
      aria-label={`${t('entrar.abrirTurno.fondo')}: $${vacio ? '0.00' : fondoVisible(raw)}`}
      flexDirection="row"
      alignItems="center"
      gap={6}
      height={72}
      paddingHorizontal={18}
      borderRadius={radii[5]}
      borderWidth={borderWidths.thick}
      borderColor={colors.black}
      backgroundColor={colors.yellowSoft}
      style={{ boxShadow: shadows.card }}
    >
      <MText size="xl6" weight="extraBold">
        $
      </MText>
      <MText
        flex={1}
        size="xl6"
        weight="extraBold"
        numberOfLines={1}
        fontVariant={['tabular-nums']}
        color={vacio ? colors.textMuted : colors.black}
      >
        {vacio ? '0.00' : fondoVisible(raw)}
      </MText>
      <MText size="md" weight="extraBold" color={colors.gray600}>
        MXN
      </MText>
    </View>
  );
}

export function FondoRapidos(props: { raw: string; onElegir: (c: bigint) => void }): ReactElement {
  const { t } = useTranslation();
  const actual = centavosDe(props.raw);
  return (
    <View
      role="radiogroup"
      aria-label={t('entrar.abrirTurno.rapidos')}
      flexDirection="row"
      gap={8}
      testID="abrir-quick-amounts"
    >
      {RAPIDOS.map((c) => (
        <View key={String(c)} flex={1}>
          <Chip
            label={etiquetaRapido(c)}
            selected={actual === c}
            onPress={() => props.onElegir(c)}
            testID={`fondo-rapido-${c / 100n}`}
          />
        </View>
      ))}
    </View>
  );
}

function tecla(
  k: TeclaFondo,
  onTecla: (k: TeclaFondo) => void,
  puntoLabel: string,
  borrarLabel: string,
): ReactElement {
  if (k === 'borrar') {
    return (
      <Tecla
        key={k}
        label=""
        ariaLabel={borrarLabel}
        tono="suave"
        height={50}
        icon={<PathIcon d={BORRAR} size={22} />}
        onPress={() => onTecla(k)}
        testID="numpad-backspace"
      />
    );
  }
  const aria = k === '.' ? puntoLabel : undefined;
  return (
    <Tecla
      key={k}
      label={k}
      ariaLabel={aria}
      height={50}
      onPress={() => onTecla(k)}
      testID={k === '.' ? 'numpad-dot' : `numpad-${k}`}
    />
  );
}

export function FondoTeclas(props: { onTecla: (k: TeclaFondo) => void }): ReactElement {
  const { t } = useTranslation();
  return (
    <View gap={8} testID="abrir-numpad">
      {FILAS.map((fila) => (
        <View key={fila.join('')} flexDirection="row" gap={8}>
          {fila.map((k) =>
            tecla(k, props.onTecla, t('entrar.abrirTurno.punto'), t('entrar.nip.borrarAria')),
          )}
        </View>
      ))}
    </View>
  );
}

export function FondoEtiqueta(): ReactElement {
  const { t } = useTranslation();
  return <Eyebrow>{t('entrar.abrirTurno.fondo')}</Eyebrow>;
}
