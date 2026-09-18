'use client';

import { useRef, useState } from 'react';
import { colors, portalFontSizes, radii } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import { parseRecibido } from '../caja/ticket';
import { ModalBotones } from '../ui/botones';
import { ChoiceChips } from '../ui/choice';
import * as f from '../ui/field.css';
import { OpModal } from '../ui/modal';
import { MontoInput } from '../ui/monto';
import { Note } from '../ui/note';
import * as u from '../ui/ui.css';
import * as g from './gastos.css';
import { CATEGORIAS, type CategoriaGasto } from './types';

const CAMERA =
  'M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4l-1.5-2ZM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z';

export interface NuevoGasto {
  readonly monto: bigint;
  readonly concepto: string;
  readonly categoria: CategoriaGasto;
  /** The receipt photo's file name; `null` means «sin comprobante». */
  readonly foto: string | null;
}

/**
 * «Registrar gasto de caja chica»: amount, concept and category are required;
 * the receipt is optional and its absence is recorded. Mounted per opening.
 */
export function RegistrarGasto(p: {
  readonly firma: string;
  readonly onClose: () => void;
  readonly onSave: (g: NuevoGasto) => void;
}) {
  const x = useFormGasto(p.onSave);
  return (
    <OpModal
      open
      onClose={p.onClose}
      title="Registrar gasto de caja chica"
      titleSize={portalFontSizes.lgx}
      width={520}
      headBg={colors.redSoft}
    >
      <MontoInput id="eg-monto" label="Monto" value={x.raw} onChange={x.setRaw} size="gasto" />
      <Concepto value={x.concepto} onChange={x.setConcepto} />
      <ChoiceChips
        label="Categoría"
        options={CATEGORIAS}
        value={x.categoria}
        onChange={x.setCategoria}
      />
      <Comprobante foto={x.foto} setFoto={x.setFoto} />
      <Note bg={colors.gray100} textColor={colors.ink}>
        Sale del efectivo de tu caja y baja lo esperado en tu corte. Queda a tu nombre: {p.firma}.
      </Note>
      <ModalBotones
        volver="Cancelar"
        confirmar="Registrar gasto"
        listo={x.listo}
        tint={colors.yellow}
        onBack={p.onClose}
        onConfirm={x.save}
      />
    </OpModal>
  );
}

function useFormGasto(onSave: (g: NuevoGasto) => void) {
  const [raw, setRaw] = useState('');
  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState<CategoriaGasto | null>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const monto = parseRecibido(raw);
  const listo = monto !== null && monto > 0n && concepto.trim() !== '' && categoria !== null;
  const save = () => {
    if (monto !== null && categoria !== null && listo) {
      onSave({ monto, concepto: concepto.trim(), categoria, foto });
    }
  };
  return {
    raw,
    setRaw,
    concepto,
    setConcepto,
    categoria,
    setCategoria,
    foto,
    setFoto,
    listo,
    save,
  };
}

function Concepto(p: { readonly value: string; readonly onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor="eg-concepto" className={f.label}>
        Concepto
      </label>
      <input
        id="eg-concepto"
        type="text"
        className={f.text}
        placeholder="Cilindro de gas"
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
      />
    </div>
  );
}

/** Opens the camera (or the file picker on desktop); tapping an attached receipt removes it. */
function Comprobante(p: {
  readonly foto: string | null;
  readonly setFoto: (f: string | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const adjunto = p.foto !== null;
  return (
    <div>
      <div className={f.label} style={{ marginBottom: 8 }}>
        Comprobante
      </div>
      <button
        type="button"
        className={g.foto}
        data-adjunto={adjunto ? '' : undefined}
        onClick={() => (adjunto ? p.setFoto(null) : input.current?.click())}
      >
        <span
          className={u.tintBox}
          style={{ width: 44, height: 44, borderRadius: radii[2], background: colors.white }}
        >
          <Icon path={CAMERA} size={21} strokeWidth={2.3} />
        </span>
        <FotoTexto foto={p.foto} />
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Foto del comprobante"
        hidden
        onChange={(e) => p.setFoto(e.target.files?.[0]?.name ?? null)}
      />
    </div>
  );
}

function FotoTexto({ foto }: { readonly foto: string | null }) {
  return (
    <span style={{ minWidth: 0 }}>
      <span className={g.fotoTitle}>
        {foto === null ? 'Tomar foto del comprobante' : 'Comprobante adjunto'}
      </span>
      <span className={g.fotoHint}>
        {foto === null
          ? 'Si no hay ticket, el gasto queda marcado sin comprobante'
          : `${foto} · toca para quitarlo`}
      </span>
    </span>
  );
}
