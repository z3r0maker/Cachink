/**
 * Cierre, step 1 «Cuenta la caja» (M-17, MvCierreFlujo): only the count. The
 * expected cash stays out of sight until the operator has counted, so the
 * count says what is in the drawer, not what should be. The foot holds the
 * running «Contaste» and «Ver resultado».
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { colors } from '../../theme';
import { CierreConteo } from './cierre-conteo';
import { CierreMarco, PasoCabeza } from './cierre-marco';
import type { CierreEstado } from './use-cierre-estado';

const FLECHA = 'M5 12h14M13 6l6 6-6 6';

function Pie(p: { readonly contado: bigint; readonly onSeguir: () => void }): ReactElement {
  return (
    <>
      <View flexDirection="row" alignItems="baseline" gap={12}>
        <MText size="body" weight="bold" color={colors.gray600}>
          Contaste
        </MText>
        <MText
          size="xl4"
          weight="extraBold"
          fontVariant={['tabular-nums']}
          letterSpacing={-0.8}
          marginLeft="auto"
          testID="cierre-contado"
        >
          {formatMoney(p.contado)}
        </MText>
      </View>
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        icon={<PathIcon d={FLECHA} size={20} strokeWidth={2.6} />}
        onPress={p.onSeguir}
        testID="cierre-ver-resultado"
      >
        Ver resultado
      </Btn>
    </>
  );
}

export function CierrePasoContar(p: {
  readonly x: CierreEstado;
  readonly onSeguir: () => void;
  readonly testID: string;
}): ReactElement {
  return (
    <CierreMarco testID={p.testID} pie={<Pie contado={p.x.e.contado} onSeguir={p.onSeguir} />}>
      <PasoCabeza
        paso={1}
        titulo="Cuenta la caja"
        linea="Saca todo el efectivo y pon cuántos hay de cada uno. Lo esperado lo ves después."
        testID="cierre-paso-contar"
      />
      <CierreConteo conteo={p.x.conteo} poner={p.x.poner} onLimpiar={p.x.limpiar} />
    </CierreMarco>
  );
}
