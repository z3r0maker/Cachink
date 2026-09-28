/**
 * «Mandar comprobante» (MvVentaHecha, the share sheet): how it reaches the
 * customer (the business's comprobante template), then WhatsApp, Mensajes
 * and the phone's share menu. Each tap confirms in a line; «Listo, nueva
 * venta» closes everything.
 */
import { useState, type ReactElement } from 'react';
import { Pressable } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { View } from '@tamagui/core';
import { formatMoney, type Business } from '@xangarro/domain';
import { BottomSheet } from '../../components/BottomSheet/index';
import { Btn } from '../../components/Btn/index';
import { Eyebrow } from '../../components/Panel/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';
import { porMensaje, porMenu, porWhatsApp } from './comprobante-acciones';
import { comprobanteSvgDe, comprobanteTexto, marcaDe } from './comprobante';
import type { VentaHecha } from './venta-hecha';

export interface ComprobanteSheetProps {
  readonly open: boolean;
  readonly venta: VentaHecha;
  readonly business: Business | null;
  readonly onClose: () => void;
  readonly onNueva: () => void;
}

interface OpcionDef {
  readonly d: string;
  readonly tint: string;
  readonly titulo: string;
  readonly hint: string;
  readonly correr: (texto: string) => Promise<string>;
  readonly testID: string;
}

const OPCIONES: readonly OpcionDef[] = [
  {
    d: COBRAR_GLYPHS.whatsapp,
    tint: colors.greenSoft,
    titulo: 'WhatsApp',
    hint: 'Escoges el contacto y le das enviar',
    correr: porWhatsApp,
    testID: 'comprobante-whatsapp',
  },
  {
    d: COBRAR_GLYPHS.mensaje,
    tint: colors.blueSoft,
    titulo: 'Mensajes',
    hint: 'Como mensaje de texto al cliente',
    correr: porMensaje,
    testID: 'comprobante-mensajes',
  },
  {
    d: COBRAR_GLYPHS.copiar,
    tint: colors.gray100,
    titulo: 'Copiar o compartir',
    hint: 'Se abre el menú del teléfono; ahí está Copiar',
    correr: porMenu,
    testID: 'comprobante-menu',
  },
];

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

function Opcion({ o, onPress }: { o: OpcionDef; onPress: () => void }): ReactElement {
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

function Aviso({ texto }: { texto: string }): ReactElement | null {
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
      testID="comprobante-aviso"
    >
      <MText size="md" weight="bold" color={colors.greenText}>
        {texto}
      </MText>
    </View>
  );
}

function Vista({ svg, texto }: { svg: string; texto: string }): ReactElement {
  return (
    <View gap={8} role="region" aria-label="Así le llega al cliente">
      <View
        alignItems="center"
        padding={12}
        borderRadius={radii[4]}
        backgroundColor={colors.gray100}
        role="img"
        aria-label={texto}
      >
        <SvgXml xml={svg} width="100%" height={300} />
      </View>
      <Eyebrow>Así le llega</Eyebrow>
      <MText size="md" weight="semibold" color={colors.gray600}>
        El cliente recibe el comprobante con lo que compró, lo que pagó y su cambio.
      </MText>
    </View>
  );
}

const eyebrowDe = (v: VentaHecha): string =>
  [v.folio, formatMoney(v.total), v.cambio !== null ? `Cambio ${formatMoney(v.cambio)}` : null]
    .filter(Boolean)
    .join(' · ');

export function ComprobanteSheet(p: ComprobanteSheetProps): ReactElement {
  const [aviso, setAviso] = useState('');
  const v = p.venta;
  const texto = comprobanteTexto(v, marcaDe(p.business));
  const pie = (
    <Btn
      variant="primary"
      size="xl"
      sentence
      fullWidth
      onPress={p.onNueva}
      testID="comprobante-nueva"
    >
      Listo, nueva venta
    </Btn>
  );
  return (
    <BottomSheet
      open={p.open}
      onClose={p.onClose}
      eyebrow={eyebrowDe(v)}
      title="Mandar comprobante"
      closeLabel="Cerrar y volver a la venta"
      testID="comprobante-sheet"
      footer={pie}
    >
      <View gap={10}>
        <Vista
          svg={comprobanteSvgDe(v, p.business)}
          texto={`Comprobante de la venta ${v.folio}: total ${formatMoney(v.total)}`}
        />
        {OPCIONES.map((o) => (
          <Opcion key={o.testID} o={o} onPress={() => void o.correr(texto).then(setAviso)} />
        ))}
        <Aviso texto={aviso} />
      </View>
    </BottomSheet>
  );
}
