/**
 * Who sells Xangarro, where it is and how to complain, in view before anyone
 * signs up (LFPC art. 76 Bis III; board PvPieLanding). Both footers mount it:
 * the home page's and the support page's.
 */
import { DOMICILIO_COMPLETO, EMPRESA, telHref } from '../landing/empresa.js';

export function ContactoLegal({ className, prefijo = '' }) {
  return (
    <div className={className} data-testid="contacto-legal">
      <span>
        {prefijo}
        {EMPRESA.nombre} es un servicio de {EMPRESA.razonSocial}
      </span>
      <span>{DOMICILIO_COMPLETO}</span>
      <span>
        ¿Dudas o quejas? Escribe a <a href={`mailto:${EMPRESA.correo}`}>{EMPRESA.correo}</a> o llama
        al <a href={telHref(EMPRESA.telefono)}>{EMPRESA.telefono}</a>.
      </span>
    </div>
  );
}
