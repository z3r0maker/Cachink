/**
 * Cierre, step 2 «Resultado» (M-16, MvCierreFlujo): what the count did said
 * in its title, the result card, the reason a difference asks for, how the
 * expected cash was formed and, while records wait, the band that warns but
 * never blocks (ADR-123). The foot closes, or goes back to count again.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { pistaResultado, TITULO_RESULTADO, type CierreData } from '@xangarro/caja/cierre';
import { MText } from '../../components/Mostrador/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { CierreBanda, type ColaCierre } from './cierre-banda';
import { CierreCerrar } from './cierre-cerrar';
import { Explica } from './cierre-explica';
import { CierreDesglose, CierreResultado } from './cierre-lado';
import { CierreMarco, PasoCabeza } from './cierre-marco';
import type { CierreEstado } from './use-cierre-estado';

/** The failed close, in red, above the button that stays. */
function ErrorCierre(p: { readonly texto: string }): ReactElement {
  return (
    <View
      role="alert"
      testID="cierre-error-cerrar"
      padding={12}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.redSoft}
    >
      <MText size="sm" weight="bold" color={colors.redText}>
        {p.texto}
      </MText>
    </View>
  );
}

/** The reason chips and the note, on their own white panel. */
function Motivo(p: { readonly x: CierreEstado }): ReactElement {
  return (
    <View
      padding={14}
      borderRadius={radii[5]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.white}
    >
      <Explica motivo={p.x.motivo} onMotivo={p.x.setMotivo} nota={p.x.nota} onNota={p.x.setNota} />
    </View>
  );
}

export function CierrePasoResultado(p: {
  readonly x: CierreEstado;
  readonly data: CierreData;
  readonly cola: ColaCierre;
  readonly onCerrar: () => void;
  readonly onVolver: () => void;
  readonly testID: string;
}): ReactElement {
  const { e } = p.x;
  const pie = (
    <CierreCerrar e={e} guardando={p.x.guardando} onCerrar={p.onCerrar} onVolver={p.onVolver} />
  );
  return (
    <CierreMarco testID={p.testID} pie={pie}>
      <PasoCabeza
        paso={2}
        titulo={TITULO_RESULTADO[e.dif.tipo]}
        linea={pistaResultado(e.dif)}
        testID="cierre-paso-resultado"
      />
      {p.cola.porEnviar > 0 ? <CierreBanda {...p.cola} /> : null}
      <CierreResultado e={e} />
      {e.dif.tipo === 'cuadra' ? null : <Motivo x={p.x} />}
      <CierreDesglose data={p.data} />
      {p.x.error ? <ErrorCierre texto={p.x.error} /> : null}
    </CierreMarco>
  );
}
