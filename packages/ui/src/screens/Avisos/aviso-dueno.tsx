/**
 * A message from the owner (MvAvisos «De Pedro»; the web's `avisos/card.tsx`):
 * a strip with who wrote, whether it was read and when; the title and the
 * words, money in bold (red on a request to clear up a corte). A request
 * carries the reply form, or the reply once sent; a plain message offers
 * «Marcar leído». The first request is the screen's hero; the rest are quiet.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { mayuscula, type Aviso } from '@xangarro/caja/avisos';
import { Btn, MText, PathIcon } from '../../components/index';
import { borderColors, borderWidths, colors, radii, shadows, shapeRadii } from '../../theme';
import { partesConCifras } from '../Pendientes/pendientes-logica';
import { Enviada, Respuesta } from './aviso-respuesta';

export interface AvisoDuenoProps {
  readonly aviso: Aviso;
  readonly dueno: string;
  readonly hero: boolean;
  readonly draft: string;
  readonly enviando: boolean;
  readonly error: boolean;
  readonly onDraft: (t: string) => void;
  readonly onSend: () => void;
  readonly onRead: () => void;
}

const AVATAR = {
  width: 28,
  height: 28,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: shapeRadii.pill,
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  backgroundColor: colors.white,
} as const;

function tonos(aviso: Aviso) {
  const fuerte = aviso.responder !== undefined || aviso.tono === 'alerta';
  const alerta = aviso.tono === 'alerta' ? colors.redText : colors.warningText;
  const leido = aviso.leido ? colors.gray100 : colors.redSoft;
  return {
    estado: aviso.leido ? colors.gray600 : alerta,
    fondo: fuerte ? leido : colors.offwhite,
  };
}

function Tira(p: AvisoDuenoProps): ReactElement {
  const { aviso } = p;
  const t = tonos(aviso);
  const esquina = (p.hero ? radii[7] : radii[6]) - 2;
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={8}
      paddingHorizontal={14}
      paddingVertical={10}
      borderBottomWidth={p.hero ? borderWidths.thin : borderWidths.quiet}
      borderBottomColor={p.hero ? colors.black : borderColors.quiet}
      backgroundColor={t.fondo}
      borderTopLeftRadius={esquina}
      borderTopRightRadius={esquina}
    >
      <View {...AVATAR} aria-hidden>
        <PathIcon d={aviso.icono} size={15} strokeWidth={2.4} />
      </View>
      <MText size="sm" weight="extraBold">
        {mayuscula(p.dueno)}
      </MText>
      <MText size="sm" weight="extraBold" color={t.estado} testID={`aviso-estado-${aviso.id}`}>
        {`· ${aviso.leido ? 'Leído' : 'Sin leer'}`}
      </MText>
      <MText marginLeft="auto" size="sm" color={colors.gray600} fontVariant={['tabular-nums']}>
        {aviso.hora}
      </MText>
    </View>
  );
}

function Texto({ aviso }: { readonly aviso: Aviso }): ReactElement {
  const rojo = aviso.tono === 'alerta';
  return (
    <View gap={6}>
      <MText
        size={aviso.responder ? 'cardTitle' : 'sectionTitle'}
        weight="extraBold"
        letterSpacing={-0.4}
        role="heading"
      >
        {aviso.titulo}
      </MText>
      {aviso.cuerpo ? (
        <MText
          size="body"
          weight="semibold"
          color={aviso.responder ? colors.ink : colors.gray600}
          lineHeight={22}
        >
          {partesConCifras(aviso.cuerpo).map((x, i) =>
            x.cifra ? (
              <MText
                key={i}
                size="body"
                weight="extraBold"
                color={rojo ? colors.redText : colors.black}
              >
                {x.texto}
              </MText>
            ) : (
              x.texto
            ),
          )}
        </MText>
      ) : null}
    </View>
  );
}

function Acciones(p: AvisoDuenoProps): ReactElement | null {
  const { aviso } = p;
  if (aviso.respuesta) return <Enviada dueno={p.dueno} texto={aviso.respuesta} />;
  if (aviso.responder) {
    return (
      <Respuesta
        id={aviso.id}
        dueno={p.dueno}
        draft={p.draft}
        enviando={p.enviando}
        error={p.error}
        onDraft={p.onDraft}
        onSend={p.onSend}
        onRead={aviso.leido ? undefined : p.onRead}
      />
    );
  }
  if (aviso.leido) return null;
  return (
    <View alignSelf="flex-start">
      <Btn variant="quiet" size="md" sentence onPress={p.onRead} testID={`aviso-leer-${aviso.id}`}>
        Marcar leído
      </Btn>
    </View>
  );
}

export function AvisoDueno(p: AvisoDuenoProps): ReactElement {
  return (
    <View
      testID={`aviso-${p.aviso.id}`}
      role="article"
      aria-label={p.aviso.titulo}
      borderRadius={p.hero ? radii[7] : radii[6]}
      borderWidth={p.hero ? borderWidths.thick : borderWidths.quiet}
      borderColor={p.hero ? colors.black : borderColors.quiet}
      backgroundColor={colors.white}
      style={p.hero ? { boxShadow: shadows.hero } : undefined}
    >
      <Tira {...p} />
      <View paddingHorizontal={14} paddingTop={14} paddingBottom={16} gap={12}>
        <Texto aviso={p.aviso} />
        <Acciones {...p} />
      </View>
    </View>
  );
}
