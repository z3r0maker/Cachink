'use client';

import { FormularioAyuda } from './formulario';

import { pageSubtitle, pageTitle } from '../productos/productos.css';

/**
 * «Ayuda» (N-08's wiring): one form — asunto, mensaje, «Es urgente» — that
 * lands in the staff inbox with the member's business attached. The
 * expectations are deliberately low: no ticket numbers, no threads; staff
 * answer through the contact details the business already gave.
 */
export function AyudaScreen() {
  return (
    <>
      <h1 className={pageTitle}>Ayuda</h1>
      <p className={pageSubtitle}>Cuéntanos qué pasa — el equipo lo ve con tu negocio adjunto</p>
      <FormularioAyuda />
      <p style={{ marginTop: 24 }}>
        <strong>Privacidad y mis datos.</strong> Para ver, corregir o borrar tus datos personales,
        haz una <a href="/privacidad/solicitud">solicitud ARCO</a>. Te respondemos en un máximo de
        20 días hábiles.
      </p>
    </>
  );
}
