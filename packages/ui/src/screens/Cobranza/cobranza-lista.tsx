/**
 * The list itself (MvCobranzaLista): the screen's head, and the clients the
 * search and filter leave — each card opening its account or its abono. With
 * no accounts at all, the empty state explains when someone appears here.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { filtrar, type CuentaCliente, type FiltroCobranza } from '@xangarro/caja/cobranza';
import { GlyphSquare, MText } from '../../components/Mostrador/index';
import { GLYPHS } from '../../components/PathIcon/glyphs';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { CuentaTarjeta } from './cuenta-tarjeta';

export function Cabeza({ onBack }: { readonly onBack: () => void }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={12}>
      <GlyphSquare
        d={GLYPHS.chevronLeft}
        label="Volver"
        onPress={onBack}
        testID="cobranza-volver"
      />
      <View gap={2} alignItems="flex-start">
        <MText size="xl3" weight="extraBold" letterSpacing={-0.7} role="heading">
          Fiado y abonos
        </MText>
        <MText size="sm" weight="semibold" color={colors.gray600}>
          Quién te debe y quién ya abonó
        </MText>
      </View>
    </View>
  );
}

function NadieDebe(): ReactElement {
  return (
    <View
      testID="cobranza-vacio"
      gap={6}
      padding={20}
      alignItems="center"
      borderRadius={radii[6]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.white}
    >
      <MText size="body" weight="extraBold">
        Nadie te debe nada
      </MText>
      <MText size="sm" weight="semibold" color={colors.gray600} textAlign="center">
        Cuando cobres una venta fiada, el cliente aparece aquí con su saldo y podrás recibirle
        abonos.
      </MText>
    </View>
  );
}

export function Cuerpo(p: {
  readonly cuentas: readonly CuentaCliente[];
  readonly filtro: FiltroCobranza;
  readonly q: string;
  readonly abrir: (id: string, conAbono: boolean) => void;
}): ReactElement {
  if (p.cuentas.length === 0) return <NadieDebe />;
  const visibles = filtrar(p.cuentas, p.filtro, p.q);
  return (
    <View gap={10}>
      {visibles.map((c) => (
        <CuentaTarjeta
          key={c.id}
          x={c}
          onAbonar={() => p.abrir(c.id, true)}
          onVer={() => p.abrir(c.id, false)}
        />
      ))}
      {visibles.length === 0 ? (
        <MText size="sm" weight="semibold" color={colors.gray600} testID="cobranza-sin-resultados">
          Ningún cliente coincide con lo que buscas.
        </MText>
      ) : null}
    </View>
  );
}
