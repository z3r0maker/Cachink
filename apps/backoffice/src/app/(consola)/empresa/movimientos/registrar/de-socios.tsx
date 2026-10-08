'use client';

import { Opciones, type Opcion } from './opciones';

/**
 * «Dinero de socios» on Registrar (E-03, agreement Quinta). A half of a
 * funding call is not here: it is paid from Socios, against its call.
 */
const CLASES: readonly Opcion[] = [
  {
    value: 'aportacion_capital',
    title: 'Capital social',
    text: 'Lo que suscribió al constituir o en un aumento.',
  },
  {
    value: 'aportacion_adicional',
    title: 'Aportación adicional',
    text: 'Más de su mitad: cuenta para la bolsa hasta el tope del trimestre.',
  },
  {
    value: 'prestamo_socio',
    title: 'Préstamo a la empresa',
    text: 'Sin intereses; se le devuelve.',
  },
  {
    value: 'reembolso_socio',
    title: 'Reembolso de préstamo',
    text: 'La empresa le devuelve lo que prestó.',
  },
];

export function DeSocios({ socios }: { readonly socios: readonly Opcion[] }) {
  return (
    <>
      <Opciones legend="¿De qué socio?" name="socio" opciones={socios} value="" />
      <Opciones legend="¿Qué tipo de dinero?" name="clase" opciones={CLASES} value="" />
    </>
  );
}
