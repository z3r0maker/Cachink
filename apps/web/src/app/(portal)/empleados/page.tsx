import { redirect } from 'next/navigation';

/**
 * `/empleados` joined Tu equipo as «Equipo y nómina» (ADR-107): the person who
 * cobra and the employee on payroll are the same person. Old links land on
 * its Nómina tab.
 */
export default function EmpleadosPage(): never {
  redirect('/equipo?tab=nomina');
}
