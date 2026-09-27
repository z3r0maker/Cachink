'use client';

import * as Dialog from '@radix-ui/react-dialog';

import { Icon } from '../../shell/icon';
import { aDueno, mayuscula } from '../ui/dueno';
import * as u from './corte.css';
import * as e from './entrega.css';

const X = 'M18 6 6 18M6 6l12 12';

/** Hand the counted cash to the owner; he confirms on his portal. Local until the owner's side exists. */
export function Entrega(p: {
  readonly open: boolean;
  readonly monto: string;
  readonly dueno: string;
  readonly onClose: () => void;
  readonly onEntregar: () => void;
}) {
  return (
    <Dialog.Root open={p.open} onOpenChange={(o) => (o ? undefined : p.onClose())}>
      <Dialog.Portal>
        <Dialog.Overlay className={e.overlay}>
          <Dialog.Content className={e.card} aria-describedby="entrega-d">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <span className={u.eyebrow}>Entrega del efectivo</span>
                <Dialog.Title className={e.titulo}>
                  {`¿Ya le diste ${p.monto} ${aDueno(p.dueno)}?`}
                </Dialog.Title>
              </div>
              <Dialog.Close className={e.cerrar} aria-label="Cerrar">
                <Icon path={X} size={20} strokeWidth={2.2} />
              </Dialog.Close>
            </div>
            <p id="entrega-d" className={e.texto}>
              {`Cuéntalo frente a él y dáselo completo. ${mayuscula(p.dueno)} confirma en su portal que lo recibió y así queda cerrado el día.`}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" className={e.si} data-onyellow="" onClick={p.onEntregar}>
                Sí, ya se lo di
              </button>
              <button type="button" className={e.no} onClick={p.onClose}>
                Todavía no
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
