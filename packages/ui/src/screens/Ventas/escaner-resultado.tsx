/**
 * The card under the camera after a code (MvEscaner): added with «Deshacer»,
 * unknown with «Escanear otro» and «Darlo de alta», undone, or the hint.
 * Announced politely as it changes.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { GLYPHS } from '../../components/PathIcon/glyphs';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { ProductoIcono } from './cobrar-tile';
import type { UseEscaner } from './use-escaner';

const CARD = {
  padding: 12,
  gap: 10,
  borderRadius: radii[4],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  backgroundColor: colors.white,
} as const;

function Agregado({ e }: { e: UseEscaner }): ReactElement | null {
  if (e.estado.tipo !== 'agregado') return null;
  const { p } = e.estado;
  return (
    <View testID="escaner-agregado" style={{ ...CARD, flexDirection: 'row', alignItems: 'center' }}>
      <ProductoIcono icono={p.icono} tint={p.tint} />
      <View flex={1} minWidth={0}>
        <MText
          size="md"
          weight="extraBold"
        >{`Agregaste ${p.nombre}, ${formatMoney(p.precio)}`}</MText>
        <MText size="sm" weight="semibold" color={colors.gray600}>
          Ya va en el ticket
        </MText>
      </View>
      <Btn variant="secondary" size="md" onPress={e.deshacer} testID="escaner-deshacer">
        Deshacer
      </Btn>
    </View>
  );
}

function Desconocido(p: { e: UseEscaner; onAlta: (codigo: string) => void }): ReactElement | null {
  if (p.e.estado.tipo !== 'desconocido') return null;
  const { codigo } = p.e.estado;
  return (
    <View testID="escaner-desconocido" style={CARD}>
      <MText size="md" weight="extraBold">
        Ese código no está en tu catálogo
      </MText>
      <MText size="md" weight="bold" color={colors.gray600}>
        {codigo}
      </MText>
      <View flexDirection="row" gap={10}>
        <Btn variant="secondary" size="lg" onPress={p.e.otro} testID="escaner-otro">
          Escanear otro
        </Btn>
        <View flex={1}>
          <Btn
            variant="primary"
            size="lg"
            sentence
            fullWidth
            onPress={() => p.onAlta(codigo)}
            testID="escaner-alta"
          >
            Darlo de alta
          </Btn>
        </View>
      </View>
    </View>
  );
}

function Linea(p: { d?: string; texto: string; testID: string }): ReactElement {
  return (
    <View
      testID={p.testID}
      style={{
        ...CARD,
        borderWidth: borderWidths.quiet,
        borderColor: borderColors.quiet,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {p.d ? <PathIcon d={p.d} size={18} color={colors.greenText} /> : null}
      <MText flex={1} size="md" weight="semibold" color={colors.gray600}>
        {p.texto}
      </MText>
    </View>
  );
}

export function EscanerResultado(p: {
  e: UseEscaner;
  onAlta: (codigo: string) => void;
}): ReactElement {
  const s = p.e.estado;
  return (
    <View aria-live="polite">
      <Agregado e={p.e} />
      <Desconocido e={p.e} onAlta={p.onAlta} />
      {s.tipo === 'deshecho' ? (
        <Linea
          d={GLYPHS.check}
          texto={`Quitaste ${s.p.nombre} del ticket.`}
          testID="escaner-deshecho"
        />
      ) : null}
      {s.tipo === 'listo' ? (
        <Linea
          texto="Escanea uno tras otro. Cada código se agrega al ticket."
          testID="escaner-listo"
        />
      ) : null}
    </View>
  );
}
