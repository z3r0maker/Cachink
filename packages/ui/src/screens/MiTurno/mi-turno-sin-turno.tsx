/**
 * Mi turno with no turno open: Inicio's «Antes de cobrar» card (the same
 * `heroFor` card, MvAbrirTurno's backdrop) and its «Abrir turno», which opens
 * the fondo sheet (`AbrirTurnoFlow`, M-06). Moved from the old Caja screen.
 */
import { useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import { heroFor } from '@xangarro/caja/inicio';
import { Btn } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { AbrirTurnoFlow } from '../AbrirTurno/abrir-turno-flow';
import { InicioHero } from '../Inicio/inicio-hero';
import { useInicio } from '../Inicio/use-inicio';

export function SinTurno(): ReactElement {
  const { t } = useTranslation();
  const inicio = useInicio();
  const [abierto, setAbierto] = useState(false);
  const abrir = (): void => setAbierto(true);
  return (
    <View gap={12} testID="caja-open-turn">
      {inicio.data ? (
        <InicioHero
          hero={heroFor({ ...inicio.data, situacion: 'turno-cerrado' })}
          onAccion={abrir}
        />
      ) : (
        <Btn variant="primary" size="xl" fullWidth onPress={abrir} testID="inicio-hero-accion">
          {t('entrar.abrirTurno.abrir')}
        </Btn>
      )}
      <AbrirTurnoFlow open={abierto} onClose={() => setAbierto(false)} />
    </View>
  );
}
