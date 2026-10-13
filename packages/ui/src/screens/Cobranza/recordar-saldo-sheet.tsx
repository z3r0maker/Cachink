/**
 * «Recordarle su saldo a …» (MvCobranzaRecordar): the web's dialog on a
 * bottom sheet. The client's phone comes prefilled and the message carries
 * the live balance (`recordatorio`); both can be changed. «Abrir WhatsApp»
 * opens wa.me with the text ready — nothing is sent by the caja (ADR-083 D2),
 * like the comprobante (N-21); the sheet confirms in a line.
 */
import { useState, type ReactElement } from 'react';
import { Pressable, TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { BottomSheet } from '../../components/BottomSheet/index';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { abrirWhatsApp, telefonoCompleto } from './recordar-saldo';
import {
  borderColors,
  borderWidths,
  colors,
  radii,
  typography,
  portalFontSizes,
} from '../../theme';

export interface RecordarSaldoSheetProps {
  readonly open: boolean;
  readonly nombre: string;
  readonly telefono: string;
  /** The live reminder (`recordatorio`); the sheet lets the operator edit it. */
  readonly mensaje: string;
  readonly onClose: () => void;
}

const CAMPO = {
  height: 52,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 8,
  paddingHorizontal: 14,
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  backgroundColor: colors.white,
} as const;

function Telefono(p: { readonly tel: string; readonly setTel: (t: string) => void }): ReactElement {
  const completo = telefonoCompleto(p.tel);
  return (
    <View gap={6}>
      <Eyebrow>Su número</Eyebrow>
      <View style={CAMPO}>
        <MText size="body" weight="extraBold" aria-hidden>
          +52
        </MText>
        <TextInput
          testID="recordar-telefono"
          aria-label="Su número"
          inputMode="tel"
          autoComplete="tel"
          value={p.tel}
          onChangeText={(t) => p.setTel(t.replace(/[^0-9 ]/g, ''))}
          style={{
            flex: 1,
            height: 48,
            fontFamily: typography.fontFamily,
            fontWeight: '700',
            fontSize: portalFontSizes.body,
            color: colors.black,
          }}
        />
      </View>
      {completo ? null : (
        <MText role="status" size="sm" weight="bold" color={colors.redText}>
          Faltan números: son 10 dígitos.
        </MText>
      )}
    </View>
  );
}

const MENSAJE_STYLE = {
  minHeight: 110,
  padding: 12,
  borderRadius: radii[4],
  borderWidth: borderWidths.quiet,
  borderColor: borderColors.quiet,
  backgroundColor: colors.greenSoft,
  fontFamily: typography.fontFamily,
  fontWeight: '600',
  fontSize: portalFontSizes.body,
  color: colors.black,
  textAlignVertical: 'top',
} as const;

function Mensaje(p: {
  readonly msg: string;
  readonly setMsg: (m: string) => void;
  readonly original: string;
}): ReactElement {
  return (
    <View gap={6}>
      <View flexDirection="row" alignItems="baseline" gap={8}>
        <Eyebrow>Mensaje</Eyebrow>
        <MText size="xs" weight="semibold" color={colors.gray600}>
          Así le llega. Puedes cambiarlo.
        </MText>
      </View>
      <TextInput
        testID="recordar-mensaje"
        aria-label="Mensaje"
        multiline
        value={p.msg}
        onChangeText={p.setMsg}
        style={MENSAJE_STYLE}
      />
      {p.msg === p.original ? null : (
        <Pressable testID="recordar-restaurar" role="button" onPress={() => p.setMsg(p.original)}>
          <MText size="sm" weight="extraBold">
            Volver al mensaje original
          </MText>
        </Pressable>
      )}
    </View>
  );
}

function Aviso({ texto }: { readonly texto: string }): ReactElement {
  return (
    <View
      role="status"
      aria-live="polite"
      testID="recordar-aviso"
      padding={12}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.greenSoft}
    >
      <MText size="md" weight="bold" color={colors.greenText}>
        {texto}
      </MText>
    </View>
  );
}

export function RecordarSaldoSheet(p: RecordarSaldoSheetProps): ReactElement {
  const [tel, setTel] = useState(p.telefono);
  const [msg, setMsg] = useState(p.mensaje);
  const [aviso, setAviso] = useState('');
  const abrir = (): void => {
    void abrirWhatsApp(tel, msg).then(setAviso);
  };
  return (
    <BottomSheet
      open={p.open}
      onClose={p.onClose}
      eyebrow="Recordatorio por WhatsApp"
      title={`Recordarle su saldo a ${p.nombre}`}
      testID="recordar-sheet"
      footer={
        <Btn
          variant="primary"
          size="xl"
          sentence
          fullWidth
          disabled={!telefonoCompleto(tel)}
          onPress={abrir}
          testID="recordar-abrir"
        >
          Abrir WhatsApp
        </Btn>
      }
    >
      <View gap={14}>
        <Telefono tel={tel} setTel={setTel} />
        <Mensaje msg={msg} setMsg={setMsg} original={p.mensaje} />
        <MText size="xs" weight="semibold" color={colors.gray600}>
          Se abre WhatsApp con el mensaje listo. Tú decides si lo mandas.
        </MText>
        {aviso === '' ? null : <Aviso texto={aviso} />}
      </View>
    </BottomSheet>
  );
}
