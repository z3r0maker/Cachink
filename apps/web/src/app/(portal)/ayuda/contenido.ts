/**
 * What «Ayuda» knows (ADR-107): topics, quick answers and Don Cuentas's
 * step-by-step guides. Plain data, in the owner's words, every link a real
 * screen of this portal. `buscar.ts` searches it; the screen draws it.
 */
export type TemaId = 'empezar' | 'ventas' | 'productos' | 'cajas' | 'estados' | 'plan';

export interface Tema {
  readonly id: TemaId;
  readonly label: string;
}

export const TEMAS: readonly Tema[] = [
  { id: 'empezar', label: 'Para empezar' },
  { id: 'ventas', label: 'Ventas y cortes' },
  { id: 'productos', label: 'Productos e inventario' },
  { id: 'cajas', label: 'Cajas y sincronización' },
  { id: 'estados', label: 'Estados financieros' },
  { id: 'plan', label: 'Tu plan y pagos' },
];

export interface Pregunta {
  readonly tema: TemaId;
  readonly q: string;
  readonly a: string;
  /** Where the answer takes the owner, when there is a screen for it. */
  readonly ir?: { readonly label: string; readonly href: string };
  /** Other words an owner might type for it. */
  readonly tambien?: readonly string[];
}

export const PREGUNTAS: readonly Pregunta[] = [
  {
    tema: 'empezar',
    q: '¿Por dónde empiezo?',
    a: 'En «¿Cómo empiezo?» está tu lista: crea a quien cobra, agrega tus productos, conecta tu caja y haz tu primera venta. Lo que te falta también aparece en la tarjeta «Primeros pasos» del menú.',
    ir: { label: 'Ir a ¿Cómo empiezo?', href: '/como-empiezo' },
    tambien: ['inicio', 'configurar', 'pasos'],
  },
  {
    tema: 'ventas',
    q: '¿Qué es el corte del turno?',
    a: 'Es cerrar la caja al final del turno: la caja cuenta lo que se vendió, lo comparas con el efectivo que tienes y queda guardado. Aquí en el portal los ves en Cortes de turno, y si algo no cuadra, en Revisión de caja.',
    ir: { label: 'Ver Cortes de turno', href: '/cortes' },
    tambien: ['corte del día', 'cerrar caja', 'cuadrar'],
  },
  {
    tema: 'ventas',
    q: '¿Dónde veo lo que vendí hoy?',
    a: 'En Hoy ves el resumen del día, y en Ventas y gastos cada venta con quién la cobró y en qué caja. Toca una venta para ver su detalle y mandar el comprobante.',
    ir: { label: 'Ir a Ventas y gastos', href: '/movimientos' },
    tambien: ['ventas', 'ticket', 'comprobante'],
  },
  {
    tema: 'cajas',
    q: '¿Cómo conecto la caja de quien cobra?',
    a: 'En Equipo y nómina, pestaña Cajas, genera el código de ocho letras y escríbelo en su teléfono o en la computadora donde va a cobrar. En cuanto lo escribe, ya puede vender.',
    ir: { label: 'Ir a Cajas', href: '/equipo?tab=cajas' },
    tambien: ['vincular', 'teléfono', 'código', 'dispositivo'],
  },
  {
    tema: 'cajas',
    q: '¿Por qué dice «registros no enviados»?',
    a: 'Alguna de tus cajas capturó algo que el portal no pudo aceptar, por ejemplo la venta de un producto que ya archivaste. Sigue guardado en esa caja; nada se pierde. Revísalo en Sincronización.',
    ir: { label: 'Ir a Sincronización', href: '/sincronizacion' },
    tambien: ['sincronizar', 'pendientes', 'rechazos'],
  },
  {
    tema: 'cajas',
    q: '¿Qué pasa si se va el internet?',
    a: 'En el teléfono, la caja sigue cobrando sin internet. Cuando vuelve la señal, manda todo al portal solita.',
    tambien: ['sin internet', 'offline', 'señal'],
  },
  {
    tema: 'productos',
    q: '¿Cómo agrego un producto?',
    a: 'En Productos, «Nuevo producto»: su nombre, cuánto te cuesta, en cuánto lo vendes y si llevas la cuenta de existencias. Llega a todas tus cajas en su siguiente sincronización.',
    ir: { label: 'Nuevo producto', href: '/productos/nuevo' },
    tambien: ['producto', 'catálogo', 'precio'],
  },
  {
    tema: 'productos',
    q: '¿Cómo sumo existencias?',
    a: 'Un producto nuevo empieza en 0. En Productos, en su renglón, «Movimiento» registra una entrada con cuántos llegaron y a qué costo. Si vas empezando, «Inventario inicial» los captura todos de una vez.',
    ir: { label: 'Ir a Productos', href: '/productos' },
    tambien: ['inventario', 'stock', 'entrada', 'existencias'],
  },
  {
    tema: 'estados',
    q: '¿Qué me dice el Estado de resultados?',
    a: 'De lo que vendiste a lo que te quedó: primero lo que costó lo vendido, luego tus gastos y el ISR de referencia. «Para no perder» te dice cuánto necesitas vender para cubrir tus gastos.',
    ir: { label: 'Ir a Estados financieros', href: '/estados' },
    tambien: ['utilidad', 'ganancia', 'pérdida', 'margen'],
  },
  {
    tema: 'plan',
    q: '¿Puedo pedir factura de mi plan?',
    a: 'Sí. Captura tus datos fiscales en Mi negocio y cada cobro te llega con su CFDI.',
    ir: { label: 'Ir a Mi negocio', href: '/negocio' },
    tambien: ['factura', 'cfdi', 'rfc'],
  },
  {
    tema: 'plan',
    q: '¿Cómo cambio de plan?',
    a: 'En Plan y pagos ves lo que incluye cada plan y lo cambias ahí mismo.',
    ir: { label: 'Ir a Plan y pagos', href: '/suscripcion' },
    tambien: ['suscripción', 'pagar', 'precio del plan'],
  },
];
