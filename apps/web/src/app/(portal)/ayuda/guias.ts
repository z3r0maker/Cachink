import type { TemaId } from './contenido';

/**
 * Don Cuentas's guides (ADR-107): a job done one step at a time, each step
 * short enough to read at the counter, the last one a link to the screen.
 */
export interface Guia {
  readonly id: string;
  readonly tema: TemaId;
  readonly titulo: string;
  readonly minutos: number;
  readonly pasos: readonly string[];
  readonly ir: { readonly label: string; readonly href: string };
}

export const GUIAS: readonly Guia[] = [
  {
    id: 'conecta-caja',
    tema: 'cajas',
    titulo: 'Conecta la caja de quien cobra',
    minutos: 2,
    pasos: [
      'Primero, que la persona exista: en Equipo y nómina, «Nuevo operador» con su nombre y un NIP de 4 dígitos.',
      'En la pestaña Cajas, toca «Generar código». Te sale un código de ocho letras.',
      'En su teléfono o en la computadora donde va a cobrar, abre Xangarro y escribe ese código.',
      'Entra con su nombre y su NIP. Listo: esa caja ya cobra y todo llega a tu portal.',
    ],
    ir: { label: 'Ir a Cajas', href: '/equipo?tab=cajas' },
  },
  {
    id: 'primer-corte',
    tema: 'ventas',
    titulo: 'Tu primer corte de turno',
    minutos: 3,
    pasos: [
      'Al terminar el turno, en la caja toca «Cerrar turno».',
      'Cuenta el efectivo del cajón y escríbelo. La caja lo compara con lo que se vendió.',
      'Si falta o sobra, escribe por qué. El corte se guarda aunque no cuadre.',
      'Aquí en el portal lo ves en Cortes de turno; lo que no cuadró te espera en Revisión de caja.',
    ],
    ir: { label: 'Ver Cortes de turno', href: '/cortes' },
  },
  {
    id: 'primer-producto',
    tema: 'productos',
    titulo: 'Agrega tu primer producto',
    minutos: 2,
    pasos: [
      'En Productos, toca «Nuevo producto» y escribe cómo se llama. Yo le pongo un ícono.',
      'Dime cuánto te cuesta y en cuánto lo vendes; te digo cuánto ganas por cada uno.',
      'Decide si llevas la cuenta de existencias y cuándo quieres que te avise.',
      'Créalo. Luego súmale lo que tienes con «Movimiento» en su renglón.',
    ],
    ir: { label: 'Nuevo producto', href: '/productos/nuevo' },
  },
  {
    id: 'lee-resultados',
    tema: 'estados',
    titulo: 'Entiende tu estado de resultados',
    minutos: 4,
    pasos: [
      'En Estados financieros, Resultados, lee de arriba abajo: empieza en lo que vendiste.',
      'Cada barra roja es algo que se llevó dinero: lo que costó lo vendido, tus gastos, el ISR.',
      'Abajo está lo que te quedó. Verde, ganaste; rojo, perdiste.',
      'Junto, «Para no perder» te dice cuánto vender para cubrir tus gastos con el margen que tienes.',
    ],
    ir: { label: 'Ir a Estados financieros', href: '/estados' },
  },
];
