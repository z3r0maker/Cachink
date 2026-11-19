/**
 * The share sheet's rows (MvVentaHecha, MvCierreFlujo): one row per way to
 * send (WhatsApp, Mensajes, the phone's own menu), each with its icon, its
 * hint and the line the sheet confirms with. The comprobante and the corte
 * list their own rows; the rows and the confirmation look the same in both.
 */
import { useState, type ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';

export interface OpcionEnvio {
  readonly d: string;
  readonly tint: string;
  readonly titulo: string;
  readonly hint: string;
  /** Opens the way to send; resolves the line to confirm with ('' says nothing). */
  readonly correr: (texto: string) => Promise<string>;
  readonly testID: string;
}

const FILA = {
  minHeight: 64,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  padding: 10,
  borderRadius: radii[4],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  backgroundColor: colors.white,
} as const;

const ICONO = {
  width: 44,
  height: 44,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii[2],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
} as const;

function Opcion({ o, onPress }: { o: OpcionEnvio; onPress: () => void }): ReactElement {
  return (
    <Pressable
      testID={o.testID}
      role="button"
      aria-label={`${o.titulo}. ${o.hint}`}
      onPress={onPress}
      style={FILA}
    >
      <View style={{ ...ICONO, backgroundColor: o.tint }}>
        <PathIcon d={o.d} size={20} />
      </View>
      <View flex={1} alignItems="flex-start">
        <MText size="body" weight="extraBold" textAlign="left">
          {o.titulo}
        </MText>
        <MText size="sm" weight="semibold" color={colors.gray600} textAlign="left">
          {o.hint}
        </MText>
      </View>
    </Pressable>
  );
}

function Aviso({ texto, testID }: { texto: string; testID: string }): ReactElement | null {
  if (texto === '') return null;
  return (
    <View
      role="status"
      aria-live="polite"
      padding={12}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.greenSoft}
      testID={testID}
    >
      <MText size="md" weight="bold" color={colors.greenText}>
        {texto}
      </MText>
    </View>
  );
}

/** The rows, then the confirmation of the last one tapped. */
export function EnviarOpciones(p: {
  readonly opciones: readonly OpcionEnvio[];
  readonly texto: string;
  /** The confirmation's testID. */
  readonly avisoTestID: string;
}): ReactElement {
  const [aviso, setAviso] = useState('');
  return (
    <>
      {p.opciones.map((o) => (
        <Opcion key={o.testID} o={o} onPress={() => void o.correr(p.texto).then(setAviso)} />
      ))}
      <Aviso texto={aviso} testID={p.avisoTestID} />
    </>
  );
}
