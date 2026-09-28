/**
 * The black bar over the tab bar (MvCobrar): pieces · total, «Vaciar» and the
 * yellow «Cobrar» that opens the ticket. Empty, it says how to start and the
 * button stays gray.
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney, type Money } from '@xangarro/domain';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, colors, radii } from '../../theme';
import { COBRAR_GLYPHS } from './cobrar-glyphs';
import { piezasTexto } from './ticket-en-curso';

export interface CobrarBarProps {
  readonly piezas: number;
  readonly total: Money;
  /** Absent in the escáner's footer, which only goes on to the ticket. */
  readonly onVaciar?: () => void;
  readonly onCobrar: () => void;
  /** Inside a sheet's footer, which already has its margin. */
  readonly enHoja?: boolean;
}

const BOTON = {
  height: 48,
  paddingHorizontal: 18,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii[2],
} as const;

const VACIAR = {
  width: 44,
  height: 44,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii[2],
  borderWidth: borderWidths.thin,
  borderColor: colors.gray600,
} as const;

function Lleno(p: CobrarBarProps): ReactElement {
  return (
    <>
      <View flex={1} flexDirection="row" alignItems="baseline" gap={8} minWidth={0}>
        <MText size="md" weight="bold" color={colors.gray200}>
          {`${piezasTexto(p.piezas)} ·`}
        </MText>
        <MText size="xl2" weight="extraBold" color={colors.white} numberOfLines={1}>
          {formatMoney(p.total)}
        </MText>
      </View>
      {p.onVaciar ? (
        <Pressable
          testID="cobrar-bar-vaciar"
          role="button"
          aria-label="Vaciar el ticket"
          onPress={p.onVaciar}
          style={VACIAR}
        >
          <PathIcon d={COBRAR_GLYPHS.basura} size={18} color={colors.gray200} />
        </Pressable>
      ) : null}
      <Pressable
        testID="cart-checkout-btn"
        role="button"
        aria-label={`Cobrar ${formatMoney(p.total)}`}
        onPress={p.onCobrar}
        style={{ ...BOTON, backgroundColor: colors.yellow }}
      >
        <MText size="lgx" weight="extraBold">
          Cobrar
        </MText>
      </Pressable>
    </>
  );
}

function Vacio(): ReactElement {
  return (
    <>
      <MText flex={1} size="md" weight="bold" color={colors.gray200}>
        Toca un producto para empezar
      </MText>
      <View
        testID="cart-checkout-btn"
        aria-disabled
        style={{ ...BOTON, backgroundColor: colors.gray600 }}
      >
        <MText size="lgx" weight="extraBold" color={colors.gray200}>
          Cobrar
        </MText>
      </View>
    </>
  );
}

export function CobrarBar(p: CobrarBarProps): ReactElement {
  return (
    <View paddingHorizontal={p.enHoja ? 0 : 12} paddingBottom={p.enHoja ? 0 : 10}>
      <View
        testID="cobrar-bar"
        aria-live="polite"
        flexDirection="row"
        alignItems="center"
        gap={10}
        height={64}
        paddingLeft={16}
        paddingRight={8}
        borderRadius={radii[5]}
        borderWidth={borderWidths.thin}
        borderColor={colors.black}
        backgroundColor={colors.black}
      >
        {p.piezas > 0 ? <Lleno {...p} /> : <Vacio />}
      </View>
    </View>
  );
}
