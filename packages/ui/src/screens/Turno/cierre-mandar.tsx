/**
 * «Mandar el corte a los patrones» (M-16, MvCierreFlujo): the message as it
 * arrives, then WhatsApp, Mensajes and the phone's own menu — the same rows
 * and the same share actions as the sale's comprobante, so a fix to one
 * reaches both. The operator always presses send (ADR-083 D2).
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { BottomSheet } from '../../components/BottomSheet/index';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';
import { porMensaje, porMenu, porWhatsApp } from '../Checkout/comprobante-acciones';
import { EnviarOpciones, type OpcionEnvio } from '../Checkout/enviar-opciones';

const OPCIONES: readonly OpcionEnvio[] = [
  {
    d: COBRAR_GLYPHS.whatsapp,
    tint: colors.greenSoft,
    titulo: 'WhatsApp',
    hint: 'Escoges el chat y le das enviar',
    correr: porWhatsApp,
    testID: 'corte-whatsapp',
  },
  {
    d: COBRAR_GLYPHS.mensaje,
    tint: colors.blueSoft,
    titulo: 'Mensajes',
    hint: 'Escribes el número y le das enviar',
    correr: (texto) => porMensaje(texto, 'el corte'),
    testID: 'corte-mensajes',
  },
  {
    d: COBRAR_GLYPHS.copiar,
    tint: colors.gray100,
    titulo: 'Copiar o compartir',
    hint: 'Se abre el menú del teléfono; ahí está Copiar',
    correr: porMenu,
    testID: 'corte-menu',
  },
];

/** «Así les llega»: the message, one fact per line. */
function Vista(p: { readonly texto: string }): ReactElement {
  return (
    <View gap={8}>
      <Eyebrow>Así les llega</Eyebrow>
      <View
        padding={14}
        borderRadius={radii[3]}
        borderWidth={borderWidths.quiet}
        borderColor={borderColors.quiet}
        backgroundColor={colors.offwhite}
      >
        <MText size="md" weight="semibold" fontVariant={['tabular-nums']} testID="corte-mensaje">
          {p.texto}
        </MText>
      </View>
    </View>
  );
}

export function CierreMandar(p: {
  readonly open: boolean;
  readonly texto: string;
  readonly onClose: () => void;
}): ReactElement {
  return (
    <BottomSheet
      open={p.open}
      onClose={p.onClose}
      eyebrow="Corte de caja"
      title="Mandar el corte a los patrones"
      closeLabel="Cerrar y volver al corte"
      testID="corte-sheet"
      footer={
        <Btn variant="secondary" size="xl" fullWidth onPress={p.onClose} testID="corte-listo">
          Listo
        </Btn>
      }
    >
      <View gap={10}>
        <Vista texto={p.texto} />
        <EnviarOpciones opciones={OPCIONES} texto={p.texto} avisoTestID="corte-aviso" />
      </View>
    </BottomSheet>
  );
}
