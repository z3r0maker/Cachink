/**
 * «Tu respuesta» under an owner's request to clear up a corte (MvAvisos; the
 * web's `avisos/reply.tsx`): a note, the quick answers that write it for the
 * operator, «Enviar respuesta» and, while unread, «Marcar leído». Once sent,
 * the green box with what went out.
 */
import type { ReactElement } from 'react';
import { TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { aDueno } from '@xangarro/caja/avisos';
import { Btn, Chip, MText, PathIcon } from '../../components/index';
import { borderWidths, colors, portalFontSizes, radii, typography } from '../../theme';

/** Quick answers: a short label, the sentence it writes. */
export const RAPIDAS: readonly (readonly [string, string])[] = [
  ['Di cambio de más', 'Creo que di cambio de más a un cliente.'],
  ['Cobré y no capturé', 'Cobré una venta y no la capturé en la caja.'],
  ['Salió un vale', 'Salió un vale de la caja y no lo registré como gasto.'],
  ['No sé qué pasó', 'No sé qué pasó, no recuerdo nada fuera de lo normal.'],
];

const ENVIAR =
  'M14.54 21.69a.5.5 0 0 0 .94-.03l6.5-19a.5.5 0 0 0-.64-.63l-19 6.5a.5.5 0 0 0-.02.93l7.93 3.18a2 2 0 0 1 1.11 1.11zM21.85 2.15 10.91 13.09';

export interface RespuestaProps {
  readonly id: string;
  readonly dueno: string;
  readonly draft: string;
  readonly enviando: boolean;
  readonly error: boolean;
  readonly onDraft: (t: string) => void;
  readonly onSend: () => void;
  readonly onRead?: () => void;
}

const CAMPO = {
  minHeight: 88,
  padding: 12,
  textAlignVertical: 'top',
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  fontFamily: typography.fontFamily,
  fontWeight: '600',
  fontSize: portalFontSizes.body,
  color: colors.black,
} as const;

function Rapidas(p: RespuestaProps): ReactElement {
  return (
    <>
      <MText size="sm" color={colors.textMuted}>
        Respuestas rápidas
      </MText>
      <View flexDirection="row" flexWrap="wrap" gap={8}>
        {RAPIDAS.map(([label, texto]) => (
          <Chip
            key={label}
            role="checkbox"
            label={label}
            selected={p.draft === texto}
            onPress={() => p.onDraft(texto)}
          />
        ))}
      </View>
    </>
  );
}

function Botones(p: RespuestaProps): ReactElement {
  const listo = p.draft.trim().length > 3 && !p.enviando;
  return (
    <View flexDirection="row" gap={8} marginTop={4}>
      <View flex={1}>
        <Btn
          variant="primary"
          size="lg"
          sentence
          fullWidth
          disabled={!listo}
          loading={p.enviando}
          onPress={p.onSend}
          icon={<PathIcon d={ENVIAR} size={18} strokeWidth={2.2} />}
          testID={`aviso-enviar-${p.id}`}
        >
          Enviar respuesta
        </Btn>
      </View>
      {p.onRead ? (
        <Btn variant="quiet" size="lg" sentence onPress={p.onRead} testID={`aviso-leer-${p.id}`}>
          Marcar leído
        </Btn>
      ) : null}
    </View>
  );
}

export function Respuesta(p: RespuestaProps): ReactElement {
  return (
    <View gap={10}>
      <MText size="md" weight="extraBold">
        Tu respuesta
      </MText>
      <TextInput
        testID={`aviso-respuesta-${p.id}`}
        aria-label="Tu respuesta"
        multiline
        numberOfLines={3}
        maxLength={500}
        placeholder={`Cuéntale ${aDueno(p.dueno)} lo que recuerdas`}
        placeholderTextColor={colors.textMuted}
        value={p.draft}
        onChangeText={p.onDraft}
        style={CAMPO}
      />
      <Rapidas {...p} />
      {p.error ? (
        <MText role="alert" size="sm" color={colors.redText}>
          No se pudo guardar tu respuesta. Vuelve a intentarlo.
        </MText>
      ) : null}
      <Botones {...p} />
    </View>
  );
}

export function Enviada(p: { readonly dueno: string; readonly texto: string }): ReactElement {
  return (
    <View
      role="status"
      gap={6}
      paddingHorizontal={14}
      paddingVertical={12}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={colors.greenText}
      backgroundColor={colors.greenSoft}
    >
      <MText size="md" weight="extraBold" color={colors.greenText}>
        {`Le mandaste tu respuesta ${aDueno(p.dueno)}`}
      </MText>
      <MText size="body" weight="semibold" color={colors.ink} lineHeight={22}>
        {`“${p.texto}”`}
      </MText>
      <MText size="sm" weight="semibold" color={colors.gray600}>
        Si te contesta, lo ves aquí mismo.
      </MText>
    </View>
  );
}
