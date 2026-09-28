/**
 * «Escanea el producto» (MvEscaner): the camera in a bottom sheet, the torch,
 * typing the code by hand, and what each code did. A known code goes into the
 * ticket with «Deshacer»; an unknown one offers «Darlo de alta», which opens
 * Producto nuevo with the code filled in.
 */
import { useState, type ReactElement } from 'react';
import { Pressable, TextInput } from 'react-native';
import { View } from '@tamagui/core';
import type { LineaTicket } from '@xangarro/caja/caja';
import { BottomSheet } from '../../components/BottomSheet/index';
import { Btn } from '../../components/Btn/index';
import { Eyebrow } from '../../components/Panel/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, colors, portalFontSizes, radii, typography } from '../../theme';
import { CobrarBar } from './cobrar-bar';
import type { ProductoCobrar } from './cobrar-catalogo';
import { COBRAR_GLYPHS } from './cobrar-glyphs';
import { EscanerCamara } from './escaner-camara';
import { EscanerResultado } from './escaner-resultado';
import { resumenTicket } from './ticket-en-curso';
import { useEscaner } from './use-escaner';

export interface EscanerSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly folio: string | null;
  readonly productos: readonly ProductoCobrar[];
  readonly lines: readonly LineaTicket[];
  readonly onAgregar: (p: ProductoCobrar) => void;
  readonly onQuitarUno: (p: ProductoCobrar) => void;
  /** «Darlo de alta»: Producto nuevo with this code. */
  readonly onAlta: (codigo: string) => void;
  /** The bar's «Cobrar»: on to the ticket. */
  readonly onCobrar: () => void;
}

function Manual({ onBuscar }: { onBuscar: (c: string) => void }): ReactElement {
  const [codigo, setCodigo] = useState('');
  const buscar = (): void => {
    if (codigo.trim() === '') return;
    onBuscar(codigo);
    setCodigo('');
  };
  return (
    <View gap={6}>
      <Eyebrow>Escribe los números del código</Eyebrow>
      <View flexDirection="row" gap={8}>
        <TextInput
          testID="escaner-codigo"
          aria-label="Números del código de barras"
          inputMode="numeric"
          placeholder="7501234567897"
          placeholderTextColor={colors.textMuted}
          value={codigo}
          onChangeText={(t) => setCodigo(t.replace(/[^0-9]/g, ''))}
          onSubmitEditing={buscar}
          style={{
            flex: 1,
            height: 48,
            paddingHorizontal: 14,
            borderRadius: radii[3],
            borderWidth: borderWidths.thin,
            borderColor: colors.black,
            fontFamily: typography.fontFamily,
            fontWeight: '700',
            fontSize: portalFontSizes.lg,
            color: colors.black,
          }}
        />
        <Btn variant="primary" size="lg" sentence onPress={buscar} testID="escaner-buscar">
          Buscar
        </Btn>
      </View>
    </View>
  );
}

const LUZ = {
  width: 52,
  height: 52,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
} as const;

function Controles(p: {
  luz: boolean;
  onLuz: () => void;
  manual: boolean;
  onManual: () => void;
}): ReactElement {
  return (
    <View flexDirection="row" gap={10}>
      <Pressable
        testID="escaner-luz"
        role="button"
        aria-label="Linterna"
        aria-pressed={p.luz}
        onPress={p.onLuz}
        style={{ ...LUZ, backgroundColor: p.luz ? colors.yellow : colors.white }}
      >
        <PathIcon d={COBRAR_GLYPHS.linterna} size={20} />
      </Pressable>
      <View flex={1}>
        <Btn
          variant="secondary"
          size="lg"
          fullWidth
          icon={<PathIcon d={COBRAR_GLYPHS.teclado} size={18} />}
          onPress={p.onManual}
          testID="escaner-manual"
        >
          {p.manual ? 'Mejor con la cámara' : 'Escribir el código'}
        </Btn>
      </View>
    </View>
  );
}

function useEscanerSheet(p: EscanerSheetProps) {
  const e = useEscaner(p.productos, p.onAgregar, p.onQuitarUno);
  const [luz, setLuz] = useState(false);
  const [manual, setManual] = useState(false);
  // Every way out leaves the next opening fresh: no old card, torch off.
  const salir = (then: () => void) => (): void => {
    e.reiniciar();
    setLuz(false);
    then();
  };
  return { e, luz, setLuz, manual, setManual, salir };
}

export function EscanerSheet(p: EscanerSheetProps): ReactElement {
  const { e, luz, setLuz, manual, setManual, salir } = useEscanerSheet(p);
  const { piezas, total } = resumenTicket(p.lines);
  const pie = <CobrarBar piezas={piezas} total={total} onCobrar={salir(p.onCobrar)} enHoja />;
  return (
    <BottomSheet
      open={p.open}
      onClose={salir(p.onClose)}
      eyebrow={['Escáner', p.folio].filter(Boolean).join(' · ')}
      title="Escanea el producto"
      closeLabel="Cerrar el escáner"
      testID="escaner-sheet"
      footer={pie}
    >
      <View gap={12}>
        <EscanerCamara
          luz={luz}
          activo={p.open && e.estado.tipo !== 'desconocido'}
          onCodigo={e.leer}
        />
        <MText weight="bold" textAlign="center">
          Apunta al código de barras
        </MText>
        {manual ? <Manual onBuscar={e.leer} /> : null}
        <Controles
          luz={luz}
          onLuz={() => setLuz(!luz)}
          manual={manual}
          onManual={() => setManual(!manual)}
        />
        <EscanerResultado e={e} onAlta={(c) => salir(() => p.onAlta(c))()} />
      </View>
    </BottomSheet>
  );
}
