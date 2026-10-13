/**
 * «Anótalo a su cuenta» (Track M, M-07; board MvFiado): search the client,
 * see what they owe and what they would owe, or add a new one (the owner
 * reviews it), then «Anotar $X a la cuenta de …». No client, no fiado.
 * Presentation only; the route creates the client and registers the ticket.
 */
import { useState, type ReactElement } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney, type Money } from '@xangarro/domain';
import { matches } from '@xangarro/caja';
import type { ClienteFiado } from '@xangarro/caja/caja';
import { Eyebrow } from '../../components/Panel/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { Spinner } from '../../components/Spinner/index';
import { borderWidths, colors, portalFontSizes, radii, typography } from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';
import { ClienteNuevo, ClienteRadio, type NuevoCliente } from './fiado-partes';
import { PieAccion } from './pie-accion';

export type AQuien =
  | { readonly tipo: 'cliente'; readonly cliente: ClienteFiado }
  | { readonly tipo: 'nuevo'; readonly nombre: string; readonly telefono: string };

export interface FiadoScreenProps {
  readonly folio: string | null;
  readonly total: Money;
  readonly clientes: readonly ClienteFiado[] | null;
  readonly cargando: boolean;
  readonly registrando: boolean;
  readonly error: string | null;
  readonly dueno: string;
  readonly onAnotar: (a: AQuien) => void;
  readonly testID?: string;
}

function useEleccion() {
  const [q, setQ] = useState('');
  const [cliente, setCliente] = useState<ClienteFiado | null>(null);
  const [nuevo, setNuevo] = useState<NuevoCliente | null>(null);
  const aQuien: AQuien | null =
    nuevo !== null
      ? nuevo.nombre.trim() === ''
        ? null
        : { tipo: 'nuevo', nombre: nuevo.nombre.trim(), telefono: nuevo.telefono }
      : cliente === null
        ? null
        : { tipo: 'cliente', cliente };
  const elegir = (c: ClienteFiado): void => {
    setCliente(c);
    setNuevo(null);
  };
  const cambiarNuevo = (v: NuevoCliente | null): void => {
    setNuevo(v);
    if (v !== null) setCliente(null);
  };
  return { q, setQ, cliente, nuevo, elegir, cambiarNuevo, aQuien };
}

function Buscador(p: { q: string; onQ: (q: string) => void }): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={10}
      height={48}
      paddingHorizontal={14}
      borderRadius={radii[3]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <PathIcon d={COBRAR_GLYPHS.buscar} size={18} color={colors.gray600} />
      <TextInput
        testID="fiado-buscar"
        aria-label="Busca al cliente"
        placeholder="Busca al cliente"
        placeholderTextColor={colors.textMuted}
        value={p.q}
        onChangeText={p.onQ}
        style={{
          flex: 1,
          height: 44,
          fontFamily: typography.fontFamily,
          fontWeight: '600',
          fontSize: portalFontSizes.body,
          color: colors.black,
        }}
      />
    </View>
  );
}

function Lista(p: FiadoScreenProps & { e: ReturnType<typeof useEleccion> }): ReactElement {
  if (p.cargando) return <Spinner testID="fiado-cargando" />;
  if (p.clientes === null) {
    return (
      <MText role="alert" weight="semibold" color={colors.redText} testID="fiado-error">
        No pudimos leer tus clientes. Puedes agregarlo como cliente nuevo.
      </MText>
    );
  }
  const lista = p.clientes.filter((c) => matches(p.e.q, c.nombre));
  return (
    <View role="radiogroup" aria-label="A quién se lo anotas" gap={8}>
      {lista.map((c) => (
        <ClienteRadio
          key={c.id}
          k={c}
          total={p.total}
          on={p.e.nuevo === null && p.e.cliente?.id === c.id}
          onPick={() => p.e.elegir(c)}
        />
      ))}
      {lista.length === 0 ? (
        <MText weight="semibold" color={colors.gray600} testID="fiado-sin-resultados">
          {p.clientes.length === 0
            ? 'Todavía no hay clientes. Agrégalo como cliente nuevo.'
            : 'No hay nadie con ese nombre. Agrégalo como cliente nuevo.'}
        </MText>
      ) : null}
    </View>
  );
}

function etiqueta(a: AQuien | null, nuevoAbierto: boolean, total: Money): string {
  if (a === null) return nuevoAbierto ? 'Escribe su nombre' : 'Elige a quién se lo anotas';
  const quien = a.tipo === 'cliente' ? a.cliente.nombre : a.nombre;
  return `Anotar ${formatMoney(total)} a la cuenta de ${quien}`;
}

function Cabeza(p: FiadoScreenProps & { e: ReturnType<typeof useEleccion> }): ReactElement {
  return (
    <View padding={16} paddingBottom={10} gap={12}>
      <View>
        <Eyebrow color={colors.gray600}>
          {[p.folio, formatMoney(p.total)].filter(Boolean).join(' · ')}
        </Eyebrow>
        <MText size="xl4" weight="extraBold" letterSpacing={-0.9} role="heading">
          Anótalo a su cuenta
        </MText>
      </View>
      <Buscador q={p.e.q} onQ={p.e.setQ} />
    </View>
  );
}

export function FiadoScreen(p: FiadoScreenProps): ReactElement {
  const e = useEleccion();
  const a = e.aQuien;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View flex={1} testID={p.testID ?? 'checkout-fiado'}>
        <Cabeza {...p} e={e} />
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Lista {...p} e={e} />
          <ClienteNuevo valor={e.nuevo} onCambio={e.cambiarNuevo} dueno={p.dueno} />
        </ScrollView>
        <PieAccion
          label={etiqueta(a, e.nuevo !== null, p.total)}
          disabled={a === null}
          loading={p.registrando}
          error={p.error}
          onPress={() => (a ? p.onAnotar(a) : undefined)}
          testID="fiado-anotar"
        />
      </View>
    </KeyboardAvoidingView>
  );
}
