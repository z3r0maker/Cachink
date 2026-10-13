/**
 * AvisoDuenoTarjeta — one message from the owner (M-09; the web's
 * `AvisoCard`): the strip says who sent it, whether it was read and when;
 * the body below. An aclaración (or an alert) is strong: the red strip and
 * the reply, answered in place or already answered.
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import type { Aviso } from '@xangarro/caja/avisos';
import { aDueno } from '@xangarro/caja/avisos';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, colors, radii, shapeRadii } from '../../theme';

export interface AvisoDuenoProps {
  readonly aviso: Aviso;
  readonly dueno: string;
  readonly onResponder: () => void;
  readonly onMarcarLeido: () => void;
  /** The aviso's cta href, mapped to a route by the caller. */
  readonly onAbrir: (href: string) => void;
}

/** An aclaración or an alert, unread: the red strip the board gives them. */
const fuerte = (a: Aviso): boolean => a.responder !== undefined || a.tono === 'alerta';

const franjaFondo = (a: Aviso): string | undefined =>
  fuerte(a) && !a.leido ? colors.redSoft : undefined;
const franjaBorde = (a: Aviso): string => (fuerte(a) && !a.leido ? colors.red : colors.gray200);

function Franja(p: AvisoDuenoProps): ReactElement {
  const a = p.aviso;
  const color = a.leido
    ? colors.gray600
    : a.tono === 'alerta'
      ? colors.redText
      : colors.warningText;
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={8}
      paddingHorizontal={14}
      paddingVertical={8}
      borderBottomWidth={borderWidths.quiet}
      borderBottomColor={franjaBorde(a)}
      backgroundColor={franjaFondo(a)}
    >
      <View
        width={22}
        height={22}
        alignItems="center"
        justifyContent="center"
        borderRadius={shapeRadii.pill}
        backgroundColor={colors.white}
      >
        <PathIcon d={a.icono} size={12} strokeWidth={2.4} />
      </View>
      <MText size="xs" weight="extraBold" color={colors.gray600} numberOfLines={1} flex={1}>
        {a.tipo}
      </MText>
      <MText size="xs" weight="extraBold" color={color} numberOfLines={1}>
        · {a.leido ? 'Leído' : 'Sin leer'}
      </MText>
      <MText size="xs" weight="semibold" color={colors.gray600} numberOfLines={1}>
        {a.hora}
      </MText>
    </View>
  );
}

/** What was sent, in green, where the reply form was. */
export function RespuestaEnviada({
  dueno,
  texto,
}: {
  readonly dueno: string;
  readonly texto: string;
}): ReactElement {
  return (
    <View
      testID="aviso-respondido"
      padding={12}
      borderRadius={radii[2]}
      borderWidth={borderWidths.quiet}
      backgroundColor={colors.greenSoft}
      gap={4}
    >
      <MText size="sm" weight="extraBold" color={colors.greenText}>
        {`Le mandaste tu respuesta ${aDueno(dueno)}`}
      </MText>
      <MText size="sm" weight="semibold">{`“${texto}”`}</MText>
      <MText size="xs" weight="semibold" color={colors.gray600}>
        Si te contesta, lo ves aquí mismo.
      </MText>
    </View>
  );
}

function Cta(
  p: { readonly label: string; readonly href: string } & Pick<AvisoDuenoProps, 'onAbrir'>,
): ReactElement {
  return (
    <Pressable
      testID="aviso-cta"
      role="link"
      accessibilityLabel={p.label}
      onPress={() => p.onAbrir(p.href)}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: radii[2],
        borderWidth: borderWidths.thin,
        borderColor: colors.black,
        backgroundColor: colors.white,
      }}
    >
      <MText size="sm" weight="extraBold">
        {p.label}
      </MText>
    </Pressable>
  );
}

function Marcar(p: { readonly id: string; readonly onMarcarLeido: () => void }): ReactElement {
  return (
    <Pressable
      testID={`aviso-marcar-${p.id}`}
      role="button"
      accessibilityLabel="Marcar como leído"
      onPress={p.onMarcarLeido}
      style={{ paddingVertical: 12, paddingHorizontal: 10 }}
    >
      <MText size="sm" weight="extraBold" color={colors.gray600}>
        Marcar leído
      </MText>
    </Pressable>
  );
}

/** The reply's way in, and the quiet read mark beside the cta. */
function Acciones(p: AvisoDuenoProps & { readonly puedeResponder: boolean }): ReactElement {
  return (
    <View flexDirection="row" gap={8} alignItems="center">
      {p.puedeResponder ? (
        <Pressable
          testID={`aviso-responder-${p.aviso.id}`}
          role="button"
          accessibilityLabel="Responder el aviso"
          onPress={p.onResponder}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: radii[2],
            borderWidth: borderWidths.thin,
            borderColor: colors.black,
            backgroundColor: colors.yellow,
          }}
        >
          <MText size="sm" weight="extraBold">
            Responder
          </MText>
        </Pressable>
      ) : p.aviso.cta ? (
        <Cta {...p.aviso.cta} onAbrir={p.onAbrir} />
      ) : null}
      {p.aviso.leido ? null : <Marcar id={p.aviso.id} onMarcarLeido={p.onMarcarLeido} />}
    </View>
  );
}

export function AvisoDuenoTarjeta(p: AvisoDuenoProps): ReactElement {
  const a = p.aviso;
  const puedeResponder = a.responder !== undefined && a.respuesta === undefined;
  return (
    <View
      testID={`aviso-dueno-${a.id}`}
      borderRadius={radii[4]}
      borderWidth={borderWidths.quiet}
      backgroundColor={colors.white}
      overflow="hidden"
    >
      <Franja {...p} />
      <View padding={14} gap={10}>
        <MText size="md" weight="extraBold">
          {a.titulo}
        </MText>
        {a.cuerpo === '' ? null : (
          <MText size="sm" weight="semibold" color={colors.gray600} lineHeight={19}>
            {a.cuerpo}
          </MText>
        )}
        {a.respuesta !== undefined ? (
          <RespuestaEnviada dueno={p.dueno} texto={a.respuesta} />
        ) : null}
        <Acciones {...p} puedeResponder={puedeResponder} />
      </View>
    </View>
  );
}
