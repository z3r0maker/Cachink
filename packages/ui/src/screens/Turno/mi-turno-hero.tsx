/**
 * «Efectivo que debe haber» (MvTurno's yellow hero): the figure, what it is
 * for, and «Ver de dónde sale», which unfolds its four parts and «Debe
 * haber». Folded on every visit, so the figure is said once. Closing the
 * turno is the screen's fixed foot, not this card's.
 */
import { useState, type ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import type { TurnoData } from '@xangarro/caja/turno';
import { GLYPHS, PathIcon } from '../../components/index';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow, HeroPanel } from '../../components/Panel/index';
import { borderWidths, colors } from '../../theme';
import { MiTurnoDesglose } from './mi-turno-desglose';

/** «Ver de dónde sale» / «Ocultar de dónde sale», with its chevron. */
function Pliegue(p: { readonly abierto: boolean; readonly onToggle: () => void }): ReactElement {
  const label = p.abierto ? 'Ocultar de dónde sale' : 'Ver de dónde sale';
  return (
    <Pressable
      testID="turno-ver-desglose"
      role="button"
      aria-label={label}
      aria-expanded={p.abierto}
      onPress={p.onToggle}
      style={{
        marginTop: 10,
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderTopWidth: borderWidths.thin,
        borderTopColor: colors.yellowDeep,
      }}
    >
      <MText size="md" weight="extraBold" flex={1}>
        {label}
      </MText>
      <PathIcon d={p.abierto ? GLYPHS.chevronUp : GLYPHS.chevronDown} size={18} strokeWidth={2.4} />
    </Pressable>
  );
}

export function MiTurnoHero(p: { readonly data: TurnoData }): ReactElement {
  const [abierto, setAbierto] = useState(false);
  return (
    <HeroPanel label="Efectivo que debe haber en la caja" testID="turno-hero">
      {/* On yellow the default muted label read 3.57:1; ink reads 12.35:1. */}
      <Eyebrow color={colors.ink}>Efectivo que debe haber</Eyebrow>
      <View marginTop={4}>
        <MText
          size="total"
          weight="extraBold"
          fontVariant={['tabular-nums']}
          letterSpacing={-1.4}
          testID="turno-debe-haber"
        >
          {formatMoney(p.data.esperado)}
        </MText>
      </View>
      <MText size="md" weight="semibold" color={colors.ink} marginTop={6}>
        Es lo que debes contar cuando cierres tu turno.
      </MText>
      <Pliegue abierto={abierto} onToggle={() => setAbierto((x) => !x)} />
      {abierto ? <MiTurnoDesglose data={p.data} /> : null}
    </HeroPanel>
  );
}
