import { redirect } from 'next/navigation';

/** Until the Resumen ships (E-16), the area opens on its first built screen. */
export default function EmpresaPage(): never {
  redirect('/empresa/corporativo');
}
