/**
 * «Recordarle su saldo» (MvRecordarSaldo, the web's Recordar): the client's
 * number prefilled when they have one, the message with the live balance
 * (`recordatorio` from `@xangarro/caja/cobranza`), both editable, then
 * WhatsApp or Mensajes on that number with the text ready, or the phone's
 * share menu. Nothing is sent by the caja: the person presses send.
 */
import { useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import { estadoCuenta, recordatorio, type CuentaCliente } from '@xangarro/caja/cobranza';
import { BottomSheet, Btn, MText, PathIcon } from '../../components/index';
import { colors } from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';
import { telValido } from './cobranza-logic';
import { recordarPorMensaje, recordarPorMenu, recordarPorWhatsApp } from './recordar-acciones';
import { Mensaje, Numero } from './recordar-partes';

export interface RecordarSheetProps {
  readonly open: boolean;
  readonly cuenta: CuentaCliente;
  /** Named in the message («Te escribimos de Taquería Don Pedro»). */
  readonly negocio: string;
  readonly onClose: () => void;
}

function Secundarios(p: { ok: boolean; tel: string; msg: string; correr: Correr }): ReactElement {
  return (
    <View flexDirection="row" gap={10}>
      <View flex={1}>
        <Btn
          variant="secondary"
          size="lg"
          fullWidth
          disabled={!p.ok}
          icon={<PathIcon d={COBRAR_GLYPHS.mensaje} size={18} />}
          onPress={() => p.correr(() => recordarPorMensaje(p.tel, p.msg))}
          testID="recordar-mensajes"
        >
          Mensajes
        </Btn>
      </View>
      <View flex={1}>
        <Btn
          variant="secondary"
          size="lg"
          fullWidth
          icon={<PathIcon d={COBRAR_GLYPHS.copiar} size={18} />}
          onPress={() => p.correr(() => recordarPorMenu(p.msg))}
          testID="recordar-compartir"
        >
          Compartir
        </Btn>
      </View>
    </View>
  );
}

type Correr = (f: () => Promise<string>) => void;

function Pie(p: { tel: string; msg: string; onAviso: (a: string) => void }): ReactElement {
  const ok = telValido(p.tel);
  const correr: Correr = (f) => void f().then(p.onAviso);
  return (
    <View gap={10}>
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        disabled={!ok}
        icon={<PathIcon d={COBRAR_GLYPHS.whatsapp} size={20} />}
        onPress={() => correr(() => recordarPorWhatsApp(p.tel, p.msg))}
        testID="recordar-whatsapp"
      >
        Mandar por WhatsApp
      </Btn>
      <Secundarios ok={ok} tel={p.tel} msg={p.msg} correr={correr} />
    </View>
  );
}

function Aviso({ texto }: { texto: string }): ReactElement | null {
  if (texto === '') return null;
  return (
    <MText role="status" size="md" weight="bold" color={colors.greenText} testID="recordar-aviso">
      {texto}
    </MText>
  );
}

export function RecordarSheet(p: RecordarSheetProps): ReactElement {
  const original = recordatorio(p.cuenta, estadoCuenta(p.cuenta), p.negocio);
  const [tel, setTel] = useState(p.cuenta.telefono);
  const [msg, setMsg] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');
  const texto = msg ?? original;
  return (
    <BottomSheet
      open={p.open}
      onClose={p.onClose}
      eyebrow={p.cuenta.nombre}
      title="Recordarle su saldo"
      closeLabel="Cerrar recordatorio"
      testID="recordar-sheet"
      footer={<Pie tel={tel} msg={texto} onAviso={setAviso} />}
    >
      <View gap={14}>
        <Numero tel={tel} onTel={setTel} />
        <Mensaje
          msg={texto}
          editado={msg !== null && msg !== original}
          onMsg={setMsg}
          onOriginal={() => setMsg(null)}
        />
        <MText size="sm" weight="semibold" color={colors.textMuted}>
          Se abre la app con el mensaje listo. Tú decides si lo mandas.
        </MText>
        <Aviso texto={aviso} />
      </View>
    </BottomSheet>
  );
}
