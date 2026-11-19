/**
 * The cobro (Track M, M-07; board MvCobroTotal): the ticket's total, pinned
 * and first; the method; and for cash the amount received with the change.
 * «Cobrar» registers the ticket. Fiado goes on to choose the client (MvFiado).
 * Presentation only; the route registers the sale.
 */
import { useState, type ReactElement, type ReactNode } from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney, type Money } from '@xangarro/domain';
import { Eyebrow } from '../../components/Panel/index';
import { MText } from '../../components/Mostrador/index';
import { borderWidths, colors, radii, shadows } from '../../theme';
import { piezasTexto } from '../Ventas/ticket-en-curso';
import { CobroEfectivo } from './cobro-efectivo';
import { Metodos, PanelSinEfectivo } from './cobro-metodos';
import {
  estadoEfectivo,
  etiquetaCobrar,
  teclear,
  type EstadoEfectivo,
  type MetodoCobro,
} from './cobro-logic';
import { medidasCobro, type MedidasCobro } from './cobro-medidas';
import { PieAccion } from './pie-accion';

export interface CobroScreenProps {
  readonly folio: string | null;
  readonly piezas: number;
  readonly total: Money;
  readonly metodos: readonly MetodoCobro[];
  readonly metodoInicial: MetodoCobro;
  readonly registrando: boolean;
  /** What went wrong with the last try, in the operator's words. */
  readonly error: string | null;
  readonly onCobrar: (c: { metodo: MetodoCobro; recibido: Money | null }) => void;
  readonly onFiado: () => void;
  readonly testID?: string;
}

/** The screen's one hero: outside the scroll, so it never leaves the screen. */
function TotalCobro(p: CobroScreenProps & { readonly m: MedidasCobro }): ReactElement {
  const nombre = ['Total a cobrar', p.folio, piezasTexto(p.piezas)].filter(Boolean).join(', ');
  return (
    <View paddingHorizontal={16} paddingTop={p.m.margen}>
      <View
        height={p.m.total}
        marginRight={4}
        justifyContent="center"
        gap={2}
        paddingHorizontal={12}
        borderRadius={radii[5]}
        borderWidth={borderWidths.thick}
        borderColor={colors.black}
        backgroundColor={colors.yellow}
        style={{ boxShadow: shadows.card }}
      >
        <Eyebrow color={colors.black} role="heading" ariaLabel={nombre}>
          Total a cobrar
        </Eyebrow>
        <MText
          testID="cobro-total"
          size={p.m.cifraTotal}
          weight="extraBold"
          letterSpacing={-1}
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.1}
          fontVariant={['tabular-nums']}
        >
          {formatMoney(p.total)}
        </MText>
      </View>
    </View>
  );
}

function Pago(p: {
  total: Money;
  metodo: MetodoCobro;
  tecleado: string;
  setTecleado: (f: (t: string) => string) => void;
  e: EstadoEfectivo;
  m: MedidasCobro;
}): ReactElement {
  if (p.metodo !== 'Efectivo') {
    const m = p.metodo === 'Tarjeta' ? 'Tarjeta' : 'Transferencia';
    return <PanelSinEfectivo metodo={m} total={p.total} />;
  }
  return (
    <CobroEfectivo
      total={p.total}
      tecleado={p.tecleado}
      estado={p.e}
      medidas={p.m}
      onTecla={(k) => p.setTecleado((t) => teclear(t, k))}
      onMonto={(v) => p.setTecleado(() => v)}
    />
  );
}

/** It only scrolls when something takes the room: a banner, large text. */
function CuerpoCobro(p: { readonly m: MedidasCobro; readonly children: ReactNode }): ReactElement {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: p.m.separacion,
        paddingBottom: p.m.margen,
        gap: p.m.separacion,
      }}
      alwaysBounceVertical={false}
      keyboardShouldPersistTaps="handled"
    >
      {p.children}
    </ScrollView>
  );
}

export function CobroScreen(p: CobroScreenProps): ReactElement {
  const inicial = p.metodoInicial === 'Fiado' ? 'Efectivo' : p.metodoInicial;
  const [metodo, setMetodo] = useState<MetodoCobro>(inicial);
  const [tecleado, setTecleado] = useState('');
  const m = medidasCobro(useWindowDimensions().height);
  const e = estadoEfectivo(tecleado, p.total);
  const efectivo = metodo === 'Efectivo';
  return (
    <View flex={1} testID={p.testID ?? 'checkout-cobro'}>
      <TotalCobro {...p} m={m} />
      <CuerpoCobro m={m}>
        <Metodos
          metodos={p.metodos}
          metodo={metodo}
          alto={m.metodo}
          onMetodo={setMetodo}
          onFiado={p.onFiado}
        />
        <Pago {...{ metodo, tecleado, setTecleado, e, m }} total={p.total} />
      </CuerpoCobro>
      <PieAccion
        label={etiquetaCobrar(metodo, p.total, e)}
        disabled={!(p.total > 0n && (!efectivo || e.alcanza))}
        loading={p.registrando}
        error={p.error}
        onPress={() => p.onCobrar({ metodo, recibido: efectivo ? e.recibido : null })}
        testID="cobro-submit"
      />
    </View>
  );
}
