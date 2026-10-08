/**
 * The hero of Registros por enviar (MvPendientes): amber while records wait,
 * blue while they are sent, green when everything is in. The sentence names
 * the money in bold (`heroe`, the web's words); after a retry that found no
 * internet it says so, and that the caja keeps trying on its own.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { Reintento } from '@xangarro/caja';
import {
  ayudaReintento,
  despuesDeReintentar,
  heroe,
  type Fase,
  type RegistroEnCola,
} from '@xangarro/caja/pendientes';
import { GLYPHS, MText, PathIcon } from '../../components/index';
import { borderWidths, colors, radii, shadows } from '../../theme';
import { partesConCifras } from './pendientes-logica';

const TONO: Readonly<Record<Fase, { fondo: string; tinta: string }>> = {
  espera: { fondo: colors.warningSoft, tinta: colors.warningText },
  reintentando: { fondo: colors.warningSoft, tinta: colors.warningText },
  enviando: { fondo: colors.blueSoft, tinta: colors.blueText },
  enviado: { fondo: colors.greenSoft, tinta: colors.greenText },
};

function Cuerpo({ texto }: { readonly texto: string }): ReactElement {
  return (
    <MText size="body" weight="semibold" color={colors.ink} lineHeight={22}>
      {partesConCifras(texto).map((p, i) =>
        p.cifra ? (
          <MText key={i} size="body" weight="extraBold" fontVariant={['tabular-nums']}>
            {p.texto}
          </MText>
        ) : (
          p.texto
        ),
      )}
    </MText>
  );
}

const TILE = {
  width: 56,
  height: 56,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii[4],
  borderWidth: borderWidths.thick,
  borderColor: colors.black,
  backgroundColor: colors.white,
} as const;

const HEROE = {
  gap: 10,
  padding: 16,
  borderRadius: radii[7],
  borderWidth: borderWidths.thick,
  borderColor: colors.black,
} as const;

function Titulo(p: { fase: Fase; eyebrow: string; titulo: string }): ReactElement {
  const t = TONO[p.fase];
  return (
    <View flexDirection="row" alignItems="center" gap={12}>
      <View {...TILE} aria-hidden>
        <PathIcon
          d={p.fase === 'enviado' ? GLYPHS.check : GLYPHS.nube}
          size={28}
          strokeWidth={2.2}
          color={t.tinta}
        />
      </View>
      <View flex={1} minWidth={0} gap={2}>
        <MText size="xs" weight="extraBold" letterSpacing={1.44} color={t.tinta}>
          {p.eyebrow.toUpperCase()}
        </MText>
        <MText size="xl2" weight="extraBold" letterSpacing={-0.6} role="heading">
          {p.titulo}
        </MText>
      </View>
    </View>
  );
}

const ENVIANDO = 'Puedes seguir cobrando. En cuanto suban, el turno se puede cerrar.';

export function PendientesHeroe(p: {
  readonly fase: Fase;
  readonly cola: readonly RegistroEnCola[];
  /** A retry ran and the caja is still offline. */
  readonly sinInternet: boolean;
  readonly reintento?: Reintento | null;
  /** «Reintentar envío» ran and the engine still waits (DS-05). */
  readonly intentado?: boolean;
}): ReactElement {
  const h = heroe(p.fase, p.cola, p.cola.length);
  const reintentando = p.fase === 'reintentando';
  return (
    <View
      testID={`pendientes-heroe-${p.fase}`}
      role="region"
      aria-label={h.titulo}
      {...HEROE}
      backgroundColor={TONO[p.fase].fondo}
      style={{ boxShadow: shadows.hero }}
    >
      <Titulo fase={p.fase} eyebrow={h.eyebrow} titulo={h.titulo} />
      {reintentando ? (
        <MText size="md" weight="extraBold" color={colors.black} testID="pendientes-ayuda">
          {ayudaReintento(p.reintento ?? null)}
        </MText>
      ) : null}
      <Cuerpo texto={p.fase === 'enviando' ? ENVIANDO : h.cuerpo} />
      {reintentando ? (
        <MText role="status" size="sm" weight="bold" color={colors.warningText}>
          {p.intentado ? despuesDeReintentar(p.reintento ?? null) : ''}
        </MText>
      ) : null}
      {p.sinInternet && p.fase === 'espera' ? (
        <MText role="status" size="sm" color={colors.warningText} testID="pendientes-sin-internet">
          Todavía no hay internet. Lo volvemos a intentar solos en un momento.
        </MText>
      ) : null}
    </View>
  );
}
