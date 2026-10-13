/**
 * ResponderSheet — the reply to an aclaración (M-09; the web's `Reply`):
 * a bottom sheet with the box, the quick answers that fill it, and
 * «Enviar respuesta». The write is the caller's; a failure keeps the text
 * and says why under the box.
 */
import { useState, type ReactElement } from 'react';
import { TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { aDueno, respuestaInvalida, RESPUESTAS_RAPIDAS } from '@xangarro/caja/avisos';
import type { Aviso } from '@xangarro/caja/avisos';
import { BottomSheet } from '../../components/BottomSheet/index';
import { Btn } from '../../components/Btn/index';
import { Chip } from '../../components/Chip/index';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { borderWidths, colors, portalFontSizes, radii, typography } from '../../theme';

const CAMPO = {
  minHeight: 52,
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
  fontFamily: typography.fontFamily,
  fontWeight: '700',
  fontSize: portalFontSizes.lg,
  color: colors.black,
  backgroundColor: colors.white,
} as const;

export interface ResponderSheetProps {
  readonly open: boolean;
  readonly aviso: Aviso;
  readonly dueno: string;
  readonly onClose: () => void;
  /** Returns null when it landed; the reason it did not when it failed. */
  readonly onEnviar: (texto: string) => Promise<string | null>;
}

function CampoRespuesta(p: {
  readonly value: string;
  readonly error: string | null;
  readonly dueno: string;
  readonly onChange: (v: string) => void;
}): ReactElement {
  return (
    <View gap={6}>
      <Eyebrow color={colors.gray600}>Tu respuesta</Eyebrow>
      <TextInput
        testID="responder-texto"
        aria-label="Tu respuesta"
        placeholder={`Cuéntale ${aDueno(p.dueno)} lo que recuerdas`}
        placeholderTextColor={colors.textMuted}
        value={p.value}
        onChangeText={p.onChange}
        multiline
        style={{ ...CAMPO, borderColor: p.error === null ? colors.black : colors.red }}
      />
      {p.error === null ? null : (
        <MText role="alert" size="sm" weight="bold" color={colors.redText} testID="responder-error">
          {p.error}
        </MText>
      )}
    </View>
  );
}

function Rapidas(p: {
  readonly value: string;
  readonly onElegir: (texto: string) => void;
}): ReactElement {
  return (
    <View gap={8}>
      <Eyebrow color={colors.gray600}>Respuestas rápidas</Eyebrow>
      <View flexDirection="row" flexWrap="wrap" gap={8}>
        {RESPUESTAS_RAPIDAS.map((r) => (
          <Chip
            key={r.label}
            label={r.label}
            selected={p.value === r.texto}
            onPress={() => p.onElegir(r.texto)}
            testID={`responder-rapida-${r.label}`}
          />
        ))}
      </View>
    </View>
  );
}

/** The reply in flight: the text, its validation, and one send at a time. */
interface RespuestaEstado {
  readonly texto: string;
  readonly escribir: (v: string) => void;
  readonly error: string | null;
  readonly bloqueado: boolean;
  readonly enviando: boolean;
  readonly enviar: () => void;
}

function useRespuesta(
  onEnviar: ResponderSheetProps['onEnviar'],
  onClose: () => void,
): RespuestaEstado {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const invalido = respuestaInvalida(texto);
  const vacio = texto.trim().length === 0;
  const bloqueado = vacio || invalido !== null || enviando;
  const escribir = (v: string): void => {
    setTexto(v);
    setFallo(null);
  };
  const enviar = (): void => {
    if (bloqueado) return;
    setEnviando(true);
    setFallo(null);
    void onEnviar(texto.trim()).then((e) => {
      setEnviando(false);
      if (e === null) {
        setTexto('');
        onClose();
        return;
      }
      setFallo(e);
    });
  };
  return {
    texto,
    escribir,
    error: fallo ?? (vacio ? null : invalido),
    bloqueado,
    enviando,
    enviar,
  };
}

export function ResponderSheet(p: ResponderSheetProps): ReactElement {
  const r = useRespuesta(p.onEnviar, p.onClose);
  return (
    <BottomSheet
      open={p.open}
      onClose={p.onClose}
      title={`Responder ${aDueno(p.dueno)}`}
      eyebrow={`Sobre ${p.aviso.responder?.asunto ?? 'su mensaje'}`}
      testID="responder-sheet"
      footer={
        <Btn
          variant="primary"
          size="lg"
          sentence
          fullWidth
          loading={r.enviando}
          disabled={r.bloqueado}
          onPress={r.enviar}
          testID="responder-enviar"
        >
          Enviar respuesta
        </Btn>
      }
    >
      <View gap={12} paddingBottom={4}>
        <CampoRespuesta value={r.texto} error={r.error} dueno={p.dueno} onChange={r.escribir} />
        <Rapidas value={r.texto} onElegir={r.escribir} />
      </View>
    </BottomSheet>
  );
}
