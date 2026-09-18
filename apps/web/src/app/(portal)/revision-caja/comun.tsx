import type { ReactNode } from 'react';
import { colors, portalFontSizes } from '@xangarro/tokens';

import { Button } from '@/components';
import { ModalBotones } from '@/operador/ui/botones';
import * as f from '@/operador/ui/field.css';
import { OpModal } from '@/operador/ui/modal';
import { eyebrow } from '@/styles/text.css';

import * as s from './form.css';

/** The review modal: yellow head, «Lo que capturó la caja», the fields, the merge offer, the exits. */
export function Revisar(p: {
  readonly titulo: string;
  readonly capturado: string;
  readonly pareceA: string | undefined;
  readonly cta: string;
  readonly listo: boolean;
  readonly onClose: () => void;
  readonly onFusionar: () => void;
  readonly onAprobar: () => void;
  readonly children: ReactNode;
}) {
  return (
    <OpModal
      open
      onClose={p.onClose}
      title={p.titulo}
      titleSize={portalFontSizes.lgx}
      width={560}
      headBg={colors.yellow}
      bodyGap={16}
    >
      <div className={s.capturado}>
        <div className={eyebrow}>Lo que capturó la caja</div>
        <div className={s.capturadoTexto}>{p.capturado}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{p.children}</div>
      {p.pareceA ? <Duplicado con={p.pareceA} onFusionar={p.onFusionar} /> : null}
      <ModalBotones
        volver="Cancelar"
        confirmar={p.cta}
        listo={p.listo}
        tint={colors.yellow}
        onBack={p.onClose}
        onConfirm={p.onAprobar}
      />
    </OpModal>
  );
}

function Duplicado({ con, onFusionar }: { readonly con: string; readonly onFusionar: () => void }) {
  return (
    <div className={s.duplicado}>
      <div className={s.duplicadoTexto}>
        Ya existe <strong>{con}</strong>. Si es lo mismo, fusiónalos: las ventas capturadas se
        mueven al registro existente.
      </div>
      <Button size="sm" variant="secondary" onClick={onFusionar}>
        Fusionar
      </Button>
    </div>
  );
}

export interface CampoDef {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly set: (v: string) => void;
  readonly className: string;
  readonly inputMode?: 'decimal' | 'numeric' | 'tel';
  readonly placeholder?: string;
}

/** Two labelled fields side by side (wrapping below 180 px each), in the modal's own sizes. */
export function Par({
  campos,
  min = 180,
}: {
  readonly campos: readonly CampoDef[];
  readonly min?: 180 | 200;
}) {
  return (
    <div
      className={s.dos}
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))` }}
    >
      {campos.map((c) => (
        <div key={c.id}>
          <label htmlFor={c.id} className={f.label}>
            {c.label}
          </label>
          <input
            id={c.id}
            type={c.inputMode === 'tel' ? 'tel' : 'text'}
            inputMode={c.inputMode}
            placeholder={c.placeholder}
            className={c.className}
            value={c.value}
            onChange={(e) => c.set(e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
