'use client';

import { Button } from '@/components';

import type { AsistidaView } from './hazlo-por-mi';
import * as s from './hazlo.css';

type Status = Exclude<AsistidaView['status'], null>;

const ESTADO: Record<Status, { chip: string; texto: string }> = {
  revision: {
    chip: 'En revisión',
    texto:
      'El equipo de Xangarro está preparando tu migración. Te avisamos por correo cuando esté lista para que la apruebes.',
  },
  esperando_aprobacion: {
    chip: 'Lista para aprobar',
    texto: 'Tu migración está lista: revísala y apruébala antes de que el equipo la guarde.',
  },
  aplicada: { chip: 'Aplicada', texto: 'Migración aplicada. Tus datos ya están en Xangarro.' },
  rechazada: { chip: 'Cancelada', texto: 'Solicitud cancelada.' },
  expirada: {
    chip: 'Expiró',
    texto: 'La aprobación expiró (14 días sin respuesta). Pide una nueva si aún la necesitas.',
  },
};

/** Where the request stands, and the decision buttons when it is the owner's turn. */
export function EstadoAsistida({
  view,
  pending,
  onResolver,
}: {
  readonly view: AsistidaView;
  readonly pending: boolean;
  readonly onResolver: (d: 'aprobar' | 'rechazar') => void;
}) {
  const status = view.status as Status;
  const archivos = `${view.fileCount} ${view.fileCount === 1 ? 'archivo entregado' : 'archivos entregados'}.`;
  return (
    <>
      <div data-testid="hazlo-por-mi-estado" className={s.estadoTono[status]}>
        <span className={s.chip}>
          <span className={s.chipPunto} aria-hidden="true" />
          {ESTADO[status].chip}
        </span>
        <p className={s.estadoTexto}>
          {ESTADO[status].texto}
          {status === 'revision' ? ` ${archivos}` : ''}
        </p>
      </div>
      {status === 'revision' && view.mayWrite ? (
        <Button variant="secondary" full disabled={pending} onClick={() => onResolver('rechazar')}>
          Cancelar solicitud
        </Button>
      ) : null}
      {status === 'esperando_aprobacion' && view.mayWrite ? (
        <Decision pending={pending} onResolver={onResolver} />
      ) : null}
    </>
  );
}

function Decision({
  pending,
  onResolver,
}: {
  readonly pending: boolean;
  readonly onResolver: (d: 'aprobar' | 'rechazar') => void;
}) {
  return (
    <div className={s.botones}>
      <Button variant="primary" disabled={pending} onClick={() => onResolver('aprobar')}>
        {pending ? 'Aplicando…' : 'Aprobar e importar'}
      </Button>
      <Button variant="secondary" disabled={pending} onClick={() => onResolver('rechazar')}>
        Rechazar
      </Button>
    </div>
  );
}
