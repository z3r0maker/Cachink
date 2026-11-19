/**
 * TurnoCerrado — what a screen that needs a turno says without one (board
 * MvTurnoCerrado): Don, one sentence and «Abrir turno», which opens the fondo
 * sheet right there. No screen sends the operator to another to open it.
 */
import type { ReactElement } from 'react';
import { EstadoVacio } from '../../components/CajaEstado/index';
import { useTranslation } from '../../i18n/index';

export type PantallaSinTurno = 'cobrar' | 'ventas' | 'turno' | 'cierre';

export interface TurnoCerradoProps {
  readonly pantalla: PantallaSinTurno;
  readonly onAbrir: () => void;
  /** The card's testID; «Abrir turno» is `<testID>-cta`. */
  readonly testID: string;
}

export function TurnoCerrado(p: TurnoCerradoProps): ReactElement {
  const { t } = useTranslation();
  const copia = `entrar.turnoCerrado.${p.pantalla}`;
  return (
    <EstadoVacio
      id={p.testID}
      encabezado={t(`${copia}.encabezado`)}
      title={t(`${copia}.titulo`)}
      body={t(`${copia}.cuerpo`)}
      cta={{ label: t('entrar.abrirTurno.abrir'), onPress: p.onAbrir }}
      // Mi turno keeps its rows and «Bloquear la caja» below.
      compacto={p.pantalla === 'turno'}
    />
  );
}
