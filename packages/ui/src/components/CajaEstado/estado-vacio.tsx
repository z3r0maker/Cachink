/**
 * EstadoVacio — the caja's empty moment (MvEstados): Don helping, what is
 * missing and, when there is one, the action that fills it. On its own it is
 * the card; with `encabezado` it is the whole screen, the card filling what
 * the heading leaves (MvTurnoCerrado). `compacto` is for a screen that has
 * more below it, like Mi turno's rows.
 */
import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import { Btn } from '../Btn/index';
import { Don } from '../Don/index';
import { MText } from '../Mostrador/mtext';
import { PathIcon } from '../PathIcon/path-icon';
import { Cuerpo, Tarjeta, Titulo } from './caja-estado-partes';

const FLECHA = 'M5 12h14M13 6l6 6-6 6';

export interface EstadoVacioProps {
  /** The card's testID; its action is `<id>-cta`. */
  readonly id: string;
  readonly title?: string;
  readonly body?: string;
  /** The action that fills the state («Cobrar la primera»). */
  readonly cta?: { readonly label: string; readonly onPress: () => void };
  /** The screen's own heading: the state then takes the whole screen. */
  readonly encabezado?: string;
  /** A smaller Don and no fill, for a screen that continues below. */
  readonly compacto?: boolean;
}

function Accion(p: {
  readonly id: string;
  readonly cta: NonNullable<EstadoVacioProps['cta']>;
}): ReactElement {
  return (
    <View alignSelf="stretch" marginTop={12}>
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        onPress={p.cta.onPress}
        icon={<PathIcon d={FLECHA} size={20} strokeWidth={2.6} />}
        testID={`${p.id}-cta`}
      >
        {p.cta.label}
      </Btn>
    </View>
  );
}

function Encabezado({ children }: { readonly children: string }): ReactElement {
  return (
    <MText size="xl4" weight="extraBold" letterSpacing={-0.8} role="heading">
      {children}
    </MText>
  );
}

export function EstadoVacio(p: EstadoVacioProps): ReactElement {
  const title = p.title ?? 'Nada por aquí todavía';
  const pantalla = p.encabezado !== undefined;
  const tarjeta = (
    <Tarjeta testID={p.id} label={title} llena={pantalla && p.compacto !== true}>
      <Don pose="ayuda" size={p.compacto === true ? 96 : 170} />
      <Titulo>{title}</Titulo>
      <Cuerpo>{p.body ?? 'En cuanto captures algo, aparece en esta lista.'}</Cuerpo>
      {p.cta ? <Accion id={p.id} cta={p.cta} /> : null}
    </Tarjeta>
  );
  if (p.encabezado === undefined) return tarjeta;
  if (p.compacto === true) {
    return (
      <View padding={16} gap={12}>
        <Encabezado>{p.encabezado}</Encabezado>
        {tarjeta}
      </View>
    );
  }
  // It scrolls so the action stays reachable on the smallest phones.
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 12 }}>
      <Encabezado>{p.encabezado}</Encabezado>
      {tarjeta}
    </ScrollView>
  );
}
