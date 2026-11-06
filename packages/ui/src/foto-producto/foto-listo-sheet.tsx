/**
 * After the shot (M-13): the photo on the product's tint and how the Cobrar
 * tile will wear it.
 *
 * - Lifted (MvFotoListo): «se levanta», «Recorté el fondo.», «Listo».
 * - Not lifted (MvFotoSinRecorte): the whole photo in its square, the note
 *   «No pude recortar el fondo.», «Guardar así».
 *
 * While the lift runs the square waits with a spinner; an error says what
 * went wrong and offers «Otra foto». Closing saves nothing.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { BottomSheet } from '../components/BottomSheet/index';
import { Btn } from '../components/Btn/index';
import { MText } from '../components/Mostrador/index';
import { PathIcon } from '../components/PathIcon/index';
import { GLYPHS } from '../components/PathIcon/glyphs';
import { Spinner } from '../components/Spinner/index';
import { borderWidths, colors } from '../theme';
import { FotoCuadro } from './foto-cuadro';
import { FOTO_GLIFOS } from './foto-glifos';
import { FotoLevanta } from './foto-levanta';
import { AsiSeVera, CuadroGrande, NotaFoto, portalDe } from './foto-partes';
import type { FotoLista } from './foto-acciones';
import type { FotoAbierta } from './use-foto-flujo';

const LADO = 240;
const DENTRO = LADO - 2 * borderWidths.thick;

export interface FotoListoSheetProps {
  readonly abierta: FotoAbierta;
  readonly dueno: string;
  readonly guardando: boolean;
  readonly onGuardar: () => void;
  readonly onOtra: () => void;
  readonly onCerrar: () => void;
}

function Recortada(p: { a: FotoAbierta; foto: FotoLista; dueno: string }): ReactElement {
  return (
    <View gap={18}>
      <CuadroGrande
        side={LADO}
        tint={p.a.s.tint}
        label={`${p.a.s.nombre}, recortado sobre su color`}
        testID="foto-recortada"
      >
        <FotoLevanta original={p.foto.original} recorte={p.foto.uri} side={DENTRO} />
      </CuadroGrande>
      <View alignItems="center">
        <MText size="body" weight="bold" textAlign="center">
          Recorté el fondo.
        </MText>
        <MText size="body" weight="semibold" color={colors.gray600} textAlign="center">
          Si no quedó bien, toma otra.
        </MText>
      </View>
      <AsiSeVera
        nombre={p.a.s.nombre}
        precio={p.a.precio}
        uri={p.foto.uri}
        tint={p.a.s.tint}
        nota={`También en ${portalDe(p.dueno)} y en las otras cajas, en cuanto se envíe.`}
      />
    </View>
  );
}

function SinRecorte(p: { a: FotoAbierta; foto: FotoLista }): ReactElement {
  return (
    <View gap={18}>
      <CuadroGrande
        side={LADO}
        tint={p.a.s.tint}
        label={`${p.a.s.nombre}, foto completa recortada en cuadro`}
        testID="foto-sin-recorte"
      >
        <FotoCuadro uri={p.foto.uri} side={DENTRO} />
      </CuadroGrande>
      <NotaFoto
        titulo="No pude recortar el fondo."
        cuerpo="Se guarda la foto completa, en cuadro. Con más luz y un fondo liso suele salir."
      />
      <AsiSeVera
        nombre={p.a.s.nombre}
        precio={p.a.precio}
        uri={p.foto.uri}
        tint={p.a.s.tint}
        nota="Se ve la foto tal cual, sin el color del producto detrás."
      />
    </View>
  );
}

function Cuerpo(p: { a: FotoAbierta; dueno: string }): ReactElement {
  const { paso } = p.a;
  if (paso.paso === 'listo') {
    return paso.foto.lifted ? (
      <Recortada a={p.a} foto={paso.foto} dueno={p.dueno} />
    ) : (
      <SinRecorte a={p.a} foto={paso.foto} />
    );
  }
  if (paso.paso === 'error') {
    return <NotaFoto titulo="No se guardó la foto." cuerpo={paso.mensaje} />;
  }
  return (
    <CuadroGrande side={LADO} tint={p.a.s.tint} label="Preparando la foto" testID="foto-procesando">
      <Spinner />
    </CuadroGrande>
  );
}

function Pie(p: FotoListoSheetProps): ReactElement {
  const { paso } = p.abierta;
  const lista = paso.paso === 'listo';
  return (
    <View gap={10}>
      {paso.paso === 'error' ? null : (
        <Btn
          variant="primary"
          size="xl"
          sentence
          fullWidth
          disabled={!lista}
          loading={p.guardando}
          onPress={p.onGuardar}
          testID="foto-guardar"
          icon={<PathIcon d={GLYPHS.check} size={20} strokeWidth={2.8} />}
        >
          {lista && !paso.foto.lifted ? 'Guardar así' : 'Listo'}
        </Btn>
      )}
      <Btn
        variant="secondary"
        size="lg"
        fullWidth
        disabled={p.guardando}
        onPress={p.onOtra}
        testID="foto-otra"
        icon={<PathIcon d={FOTO_GLIFOS.camara} size={18} strokeWidth={2.2} />}
      >
        Otra foto
      </Btn>
    </View>
  );
}

export function FotoListoSheet(p: FotoListoSheetProps): ReactElement {
  return (
    <BottomSheet
      open
      onClose={p.onCerrar}
      eyebrow="Foto del producto"
      title={p.abierta.s.nombre}
      closeLabel="Cerrar sin guardar la foto"
      testID="foto-listo-sheet"
      footer={<Pie {...p} />}
    >
      <Cuerpo a={p.abierta} dueno={p.dueno} />
    </BottomSheet>
  );
}
