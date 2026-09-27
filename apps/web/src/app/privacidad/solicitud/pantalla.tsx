'use client';

import { CalendarDays } from 'lucide-react';

import { MarcoPublico } from '../../_publico/marco';
import { chip } from '../../_publico/marco.css';
import { ancho, bajada, cabeza, titulo, zona } from '../../_publico/publico.css';
import { nombreDerecho } from './derechos';
import { FormularioArco } from './formulario';
import { Recibida } from './recibida';
import { useArcoForm } from './use-arco';

function Chip() {
  return (
    <span className={chip}>
      <CalendarDays size={16} strokeWidth={2.4} aria-hidden="true" />
      Con o sin cuenta en Xangarro
    </span>
  );
}

/** The whole ARCO page: Don helps while you write and celebrates the folio. */
export function PantallaArco() {
  const f = useArcoForm();
  const ok = f.result?.ok === true ? f.result : null;
  return (
    <MarcoPublico
      pose={ok ? 'celebrando' : 'ayuda'}
      titulo="Tus datos son tuyos."
      bajada="Pide verlos, corregirlos o borrarlos cuando quieras. Te respondemos por correo en un máximo de 20 días hábiles."
      extra={<Chip />}
    >
      <div className={`${zona} ${ancho.amplio}`}>
        <header className={cabeza}>
          <h1 className={titulo}>Tus datos personales: solicitud ARCO</h1>
          <p className={bajada}>
            Pide acceso a tus datos, corregirlos, cancelarlos, oponerte a un uso o retirar tu
            consentimiento. Te respondemos por correo en un máximo de 20 días hábiles.
          </p>
        </header>
        {ok ? (
          <Recibida
            folio={ok.folio}
            responderA={ok.responderA}
            correo={f.correo}
            derecho={nombreDerecho(f.derecho)}
            otra={f.otra}
          />
        ) : (
          <FormularioArco f={f} />
        )}
      </div>
    </MarcoPublico>
  );
}
