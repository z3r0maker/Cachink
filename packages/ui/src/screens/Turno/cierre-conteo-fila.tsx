/**
 * One denomination's row of the Cierre counter (Track M, M-09): the tinted
 * chip, the 44 px stepper (minus, the typed count, the yellow plus) and the
 * row's amount, all in centavos — whole pieces times the denomination's
 * value, junk typed as zero, never below zero.
 */
import type { ReactElement } from 'react';
import { Pressable, TextInput } from 'react-native';
import { View } from '@tamagui/core';
import {
  formatMoney,
  type ClaveDenominacion,
  type ConteoDenominaciones,
  type Denominacion,
} from '@xangarro/domain';
import { colors } from '@xangarro/tokens';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, portalFontSizes, radii, typography } from '../../theme';

const MENOS = 'M5 12h14';
const MAS = 'M12 5v14M5 12h14';

/** Each bill its own tint; peso coins share gray, centavos amber. */
export function tinte(d: Denominacion): string {
  switch (d.clave) {
    case 'billete-1000':
      return colors.purpleSoft;
    case 'billete-500':
      return colors.peachSoft;
    case 'billete-200':
      return colors.greenSoft;
    case 'billete-100':
      return colors.redSoft;
    case 'billete-50':
    case 'billete-20':
      return colors.blueSoft;
    default:
      return d.valor < 1_00n ? colors.warningSoft : colors.gray100;
  }
}

/** «billetes de $20» / «monedas de $20»: the two $20 never share a name. */
export const nombreDe = (d: Denominacion): string =>
  `${d.tipo === 'billete' ? 'billetes' : 'monedas'} de ${d.etiqueta}`;

function Paso(p: {
  readonly label: string;
  readonly path: string;
  readonly mas: boolean;
  readonly id: string;
  readonly onPress: () => void;
}): ReactElement {
  return (
    <Pressable
      testID={p.id}
      role="button"
      aria-label={p.label}
      onPress={p.onPress}
      hitSlop={2}
      style={{
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radii[2],
        borderWidth: borderWidths.thin,
        borderColor: colors.black,
        backgroundColor: p.mas ? colors.yellow : colors.white,
      }}
    >
      <PathIcon d={p.path} size={16} strokeWidth={2.8} />
    </Pressable>
  );
}

const ENTRADA = {
  width: 62,
  height: 44,
  textAlign: 'center' as const,
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  borderRadius: radii[2],
  backgroundColor: colors.white,
  fontFamily: typography.fontFamily,
  fontWeight: '700' as const,
  fontSize: portalFontSizes.lgx,
  color: colors.black,
};

/** The tinted chip with the denomination's own label. */
function Denominacion(p: { readonly d: Denominacion }): ReactElement {
  return (
    <View
      minWidth={74}
      height={40}
      alignItems="center"
      justifyContent="center"
      borderRadius={radii[2]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={tinte(p.d)}
      paddingHorizontal={10}
    >
      <MText size="body" weight="extraBold" fontVariant={['tabular-nums']}>
        {p.d.etiqueta}
      </MText>
    </View>
  );
}

/** Minus, the typed count, the yellow plus. */
function Pasos(p: {
  readonly d: Denominacion;
  readonly n: number;
  readonly poner: (clave: ClaveDenominacion, n: number) => void;
}): ReactElement {
  const nombre = nombreDe(p.d);
  return (
    <View flexDirection="row" alignItems="center" gap={7} marginLeft="auto">
      <Paso
        label={`Uno menos: ${nombre}`}
        path={MENOS}
        mas={false}
        id={`conteo-menos-${p.d.clave}`}
        onPress={() => p.poner(p.d.clave, p.n - 1)}
      />
      <TextInput
        testID={`conteo-cantidad-${p.d.clave}`}
        aria-label={`Cantidad de ${nombre}`}
        inputMode="numeric"
        autoComplete="off"
        value={String(p.n)}
        onChangeText={(t) => p.poner(p.d.clave, Number.parseInt(t.replace(/\D/g, '') || '0', 10))}
        style={ENTRADA}
      />
      <Paso
        label={`Uno más: ${nombre}`}
        path={MAS}
        mas
        id={`conteo-mas-${p.d.clave}`}
        onPress={() => p.poner(p.d.clave, p.n + 1)}
      />
    </View>
  );
}

export function Fila(p: {
  readonly d: Denominacion;
  readonly n: number;
  readonly poner: (clave: ClaveDenominacion, n: number) => void;
}): ReactElement {
  return (
    <View testID={`conteo-fila-${p.d.clave}`} flexDirection="row" alignItems="center" gap={10}>
      <Denominacion d={p.d} />
      <Pasos d={p.d} n={p.n} poner={p.poner} />
      <MText
        size="body"
        weight="extraBold"
        fontVariant={['tabular-nums']}
        minWidth={82}
        textAlign="right"
        color={p.n === 0 ? colors.gray400 : colors.black}
      >
        {p.n === 0 ? '—' : formatMoney(p.d.valor * BigInt(p.n))}
      </MText>
    </View>
  );
}

export type { ConteoDenominaciones };
