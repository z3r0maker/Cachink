/**
 * The list itself (RvFiado): the screen's head, and the clients the search
 * and filter leave as compact rows — each opening the client's page. With
 * no accounts at all, the empty state explains when someone appears here.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import {
  conCuenta,
  filtrar,
  type CuentaCliente,
  type FiltroCobranza,
} from '@xangarro/caja/cobranza';
import { CajaEstado } from '../../components/CajaEstado/index';
import { GlyphSquare, MText } from '../../components/Mostrador/index';
import { GLYPHS } from '../../components/PathIcon/glyphs';
import { colors } from '../../theme';
import { CobranzaFilas } from './cobranza-fila';

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

/** Nobody owes anything: Don's empty state (MvEstados, RvFiado «Nadie debe»). */
function NadieDebe(): ReactElement {
  return (
    <CajaEstado
      mode="empty"
      emptyTitle="Nadie te debe nada"
      emptyBody="Cuando cobres una venta fiada, el cliente aparece aquí con su saldo."
      testID="cobranza"
    />
  );
}

export function Cuerpo(p: {
  readonly cuentas: readonly CuentaCliente[];
  readonly hoy: string;
  readonly filtro: FiltroCobranza;
  readonly q: string;
  readonly abrir: (id: string) => void;
}): ReactElement {
  const cuentas = conCuenta(p.cuentas);
  if (cuentas.length === 0) return <NadieDebe />;
  const visibles = filtrar(cuentas, p.filtro, p.q);
  if (visibles.length === 0) {
    return (
      <MText size="sm" weight="semibold" color={colors.gray600} testID="cobranza-sin-resultados">
        Ningún cliente coincide con lo que buscas.
      </MText>
    );
  }
  return <CobranzaFilas cuentas={visibles} hoy={p.hoy} onAbrir={p.abrir} />;
}
