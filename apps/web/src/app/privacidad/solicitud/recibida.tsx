import { Check } from 'lucide-react';

import { Button, Card } from '@/components';

import { ceja, pila } from '../../_publico/publico.css';
import * as s from './arco.css';

/** «23 de octubre de 2026», from the server's `YYYY-MM-DD`. */
function fechaLarga(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${iso}T12:00:00Z`),
  );
}

export interface RecibidaProps {
  readonly folio: string;
  readonly responderA: string;
  readonly correo: string;
  readonly derecho: string;
  readonly otra: () => void;
}

function Fichas(p: RecibidaProps) {
  return (
    <div className={s.fichas}>
      <div className={s.fichaFolio}>
        <span className={ceja}>Tu folio</span>
        <strong className={s.folio} data-testid="arco-folio">
          {p.folio}
        </strong>
        <span className={s.fichaPie}>Guárdalo: te lo pediremos al responderte.</span>
      </div>
      <div className={s.fichaPlazo}>
        <span className={ceja}>A más tardar</span>
        <strong className={s.plazo} data-testid="arco-plazo">
          {fechaLarga(p.responderA)}
        </strong>
        <span className={s.fichaPie}>Derecho: {p.derecho}</span>
      </div>
    </div>
  );
}

/** The receipt: the folio to keep and the legal deadline, side by side. */
export function Recibida(p: RecibidaProps) {
  return (
    <Card emphasis="hero">
      <section className={pila} role="status" aria-labelledby="arco-ok" data-testid="arco-recibida">
        <div className={s.okCabeza}>
          <span className={s.okSello} aria-hidden="true">
            <Check size={26} strokeWidth={3} />
          </span>
          <h2 id="arco-ok" className={s.okTitulo}>
            Recibimos tu solicitud.
          </h2>
        </div>
        <p className={s.okTexto}>
          Te respondemos a <strong>{p.correo.trim().toLowerCase()}</strong> en un máximo de 20 días
          hábiles.
        </p>
        <Fichas {...p} />
        <p className={s.aparte}>
          Antes de actuar te pediremos por correo una identificación. Revisa también tu carpeta de
          spam.
        </p>
        <div>
          <Button variant="secondary" onClick={p.otra}>
            Enviar otra solicitud
          </Button>
        </div>
      </section>
    </Card>
  );
}
