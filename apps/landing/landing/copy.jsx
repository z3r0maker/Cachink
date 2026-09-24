/**
 * Shared copy + primitive UI bits used across landing sections.
 * Single source of truth — FAQs are also exported from here so
 * structured-data.js and the visible FAQ component stay in sync.
 */
import { useState } from 'react';

/* ─────────────── Copy decks for the 3 tones ─────────────── */
export const TONE_COPY = {
  punchy: {
    eyebrow: '¡XANGARRO! · FINANZAS CLARAS',
    h1a: 'Tu caja, clara.',
    h1b: 'Cada día.',
    sub: 'Registra ventas y egresos en 3 segundos. Ve lo que ganas hoy, sin hojas de Excel ni contadores.',
    cta1: 'Crear cuenta gratis',
    cta2: 'Ver cómo funciona',
    why: [
      { t: 'Tres segundos por venta', d: 'Abres, anotas, listo. Sin menús anidados.' },
      { t: 'Offline siempre', d: 'Aunque se caiga el internet, tu negocio no para.' },
      { t: 'Sin suscripciones infinitas', d: 'Un plan gratis generoso, un plan de pago honesto.' },
    ],
    howTitle: 'Así funciona',
    how: [
      { n: '01', t: 'Capturas', d: 'Cada venta o egreso del día. Tarda menos que abrir WhatsApp.' },
      {
        n: '02',
        t: 'Ves',
        d: 'Ventas de hoy, del mes, efectivo en caja. Actualizado al instante.',
      },
      { n: '03', t: 'Decides', d: 'KPIs para dueños, estados financieros para tu contador.' },
    ],
  },
  educational: {
    eyebrow: 'XANGARRO · CONTROL FINANCIERO PARA NEGOCIOS PEQUEÑOS',
    h1a: 'Deja de adivinar',
    h1b: 'cuánto ganaste hoy.',
    sub: 'Xangarro es una plataforma mexicana pensada para dueños de negocios pequeños. Registras lo que entra y lo que sale — desde la app o el navegador — y ella te dice, en español y en pesos, cómo va tu negocio de verdad.',
    cta1: 'Crear cuenta gratis',
    cta2: 'Conocer los módulos',
    why: [
      {
        t: 'Pensada en español, para México',
        d: 'IVA, NIF, CFDI, MXN. No traducimos software gringo.',
      },
      {
        t: 'Tu negocio sigue aunque se vaya el internet',
        d: 'Captura sin conexión en tus dispositivos; todo se sincroniza solo.',
      },
      {
        t: 'Tan simple como una libreta',
        d: 'Si sabes anotar en una libreta, sabes usar Xangarro.',
      },
    ],
    howTitle: 'Así te ayuda, paso a paso',
    how: [
      {
        n: '01',
        t: 'Registras cada movimiento',
        d: 'Ventas, egresos, inventario. En segundos, sin fórmulas.',
      },
      {
        n: '02',
        t: 'Xangarro hace las cuentas',
        d: 'Corte del día, utilidad del mes, cuentas por cobrar — automático.',
      },
      {
        n: '03',
        t: 'Compartes con tu contador',
        d: 'Exporta estados financieros en el formato que él necesita.',
      },
    ],
  },
  playful: {
    eyebrow: '¡XANGARRO! · TU NEGOCIO, CON NÚMEROS CLAROS',
    h1a: '¡Xangarro!',
    h1b: 'Sonó otra venta.',
    sub: 'La plataforma más honesta para llevar la caja de tu negocio. Sin Excel, sin drama, sin inglés de software caro.',
    cta1: 'Crear cuenta gratis',
    cta2: 'Ver la demo',
    why: [
      { t: 'Rápida como la caja registradora', d: 'Un toque y la venta queda guardada.' },
      { t: 'Clara como un recibo', d: 'Lo que entró, lo que salió, lo que queda. Sin adornos.' },
      { t: 'Para quienes hacen, no para quienes reportan', d: 'Menos botones. Más negocio.' },
    ],
    howTitle: '¿Cómo se usa? Así',
    how: [
      {
        n: '01',
        t: 'Anotas',
        d: 'La venta de la doña, el café del cliente fiel, la compra del día.',
      },
      { n: '02', t: 'Miras', d: 'Ventas hoy, utilidad del mes, qué te deben. De un vistazo.' },
      { n: '03', t: 'Creces', d: 'Con números reales — no con la corazonada de siempre.' },
    ],
  },
};

/* ─────────────── Primitive components ─────────────── */
export const Eyebrow = ({ children, light }) => (
  <div
    style={{
      display: 'inline-block',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: light ? '#D6D6D2' : 'var(--gray-600)',
    }}
  >
    {children}
  </div>
);

export function HardBtn({ children, variant = 'primary', size = 'lg', onClick, href, disabled }) {
  const V = {
    primary: { bg: 'var(--yellow)', fg: 'var(--black)' },
    dark: { bg: 'var(--black)', fg: 'var(--white)' },
    ghost: { bg: 'transparent', fg: 'var(--black)' },
    white: { bg: 'var(--white)', fg: 'var(--black)' },
  }[variant];
  const S = size === 'lg' ? { h: 54, px: 22, fs: 14 } : { h: 44, px: 18, fs: 12 };
  const [p, setP] = useState(false);
  const Tag = href ? 'a' : 'button';
  return (
    <Tag
      href={href}
      disabled={disabled}
      onMouseDown={() => setP(true)}
      onMouseUp={() => setP(false)}
      onMouseLeave={() => setP(false)}
      onTouchStart={() => setP(true)}
      onTouchEnd={() => setP(false)}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        background: V.bg,
        color: V.fg,
        border: '2px solid var(--black)',
        borderRadius: 12,
        height: S.h,
        padding: `0 ${S.px}px`,
        fontSize: S.fs,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-sans)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        opacity: disabled ? 0.6 : 1,
        boxShadow: p ? '1px 1px 0 var(--black)' : '4px 4px 0 var(--black)',
        transform: p ? 'translate(3px,3px)' : 'none',
        transition: 'transform 100ms var(--press-ease), box-shadow 100ms var(--press-ease)',
        textDecoration: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </Tag>
  );
}

export const HardCard = ({ children, variant = 'white', padding = 24, style }) => {
  const BG = {
    white: 'var(--white)',
    yellow: 'var(--yellow)',
    black: 'var(--black)',
    offwhite: 'var(--offwhite)',
  }[variant];
  return (
    <div
      style={{
        background: BG,
        border: `${variant === 'black' ? 2.5 : 2}px solid var(--black)`,
        borderRadius: 18,
        boxShadow: variant === 'black' ? '6px 6px 0 var(--black)' : '5px 5px 0 var(--black)',
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* ─────────────── FAQ — single source of truth ─────────────── */
/* Used by both structured-data.js (JSON-LD) and the visible FAQAccordion.
 * Keep answers factual and specific — LLMs cite verbatim phrasing. */
export const FAQ_ITEMS = [
  {
    q: '¿Para quién es Xangarro?',
    a: 'Xangarro es para dueños de pequeños negocios en México: panaderías, cafeterías, tiendas de barrio, talleres mecánicos, consultorios y cualquier negocio que maneje caja diaria. Si llevas el control de ventas en una libreta o en tu cabeza, Xangarro está hecho para ti.',
  },
  {
    q: '¿Cómo funciona Xangarro?',
    a: 'Registras cada venta o egreso en menos de 3 segundos: monto, concepto y método de pago, desde el navegador o desde la app de tu equipo. Xangarro calcula automáticamente tus ventas del día, del mes y el efectivo disponible en caja. Al final del mes puedes exportar un estado financiero completo para tu contador, sin necesidad de capturar nada extra.',
  },
  {
    q: '¿Funciona sin internet?',
    a: 'Sí. Tu negocio sigue aunque se vaya el internet: los dispositivos de tu equipo registran ventas y gastos sin conexión y todo se sincroniza automáticamente cuando la red vuelve. Ningún registro se pierde en el camino.',
  },
  {
    q: '¿Cuánto cuesta Xangarro?',
    a: 'Xangarrito es $0 para siempre: 300 movimientos al mes, 50 productos y el dueño más 1 empleado. Xangarro cuesta $199 MXN al mes: 10,000 movimientos, 1,000 productos, el dueño más 2 empleados, estados financieros NIF y el cierre de mes con Don Cuentas. Xangarrote cuesta $399 MXN al mes: 30,000 movimientos, 5,000 productos, el dueño más 5 empleados y Don Cuentas completo. Los precios son más IVA y el plan anual trae 2 meses gratis. Empiezas gratis con Xangarrito y cambias de plan cuando quieras.',
  },
  {
    q: '¿En qué dispositivos está disponible?',
    a: 'El portal y la caja funcionan hoy en cualquier navegador: la computadora o la tableta de tu negocio, sin instalar nada. Las apps para iOS y Android, para que tu equipo cobre desde el teléfono, llegan muy pronto a App Store y Google Play. Puedes crear tu cuenta desde ya en app.xangarro.mx.',
  },
  {
    q: '¿Es una alternativa a Excel para llevar las cuentas del negocio?',
    a: 'Sí, y mucho más simple. Con Excel necesitas crear fórmulas, mantener hojas actualizadas y calcular totales a mano. Xangarro registra cada venta en segundos, calcula los totales automáticamente y genera reportes listos para tu contador, sin que tengas que saber de hojas de cálculo. Y si ya tienes tu catálogo en Excel, lo importas en unos clics.',
  },
  {
    q: '¿Puedo compartir los estados financieros con mi contador?',
    a: 'Sí. Con los planes de pago puedes exportar estados financieros en formato NIF (Normas de Información Financiera), el estándar que usan los contadores en México, y el informe mensual en PDF se genera con un toque. Puedes enviarlo por correo o WhatsApp directamente.',
  },
  {
    q: '¿Quién es Don Cuentas?',
    a: 'Don Cuentas es el asesor de Xangarro. Todos los días revisa tus ventas, gastos e inventario y te avisa, calculado a partir de tus registros, qué subió, qué no se mueve y qué se ve raro. Cada fin de mes te entrega tu revisión con IA: qué funcionó, qué no y qué precios ajustar. El cierre de mes viene en Xangarro; Xangarrote suma la estrategia de precios y crecimiento.',
  },
  {
    q: '¿Xangarro maneja CFDI o facturación electrónica?',
    a: 'Xangarro se enfoca en el control de tu caja y tus estados financieros internos, no en emitir CFDI de tus ventas: si facturas, usa tu herramienta habitual y registra el movimiento en Xangarro para mantener tu caja cuadrada. Tu propia suscripción a Xangarro, en cambio, sí se factura automáticamente con CFDI.',
  },
  {
    q: '¿Qué métodos de pago puedo registrar?',
    a: 'Puedes registrar ventas en efectivo, tarjeta de débito o crédito, transferencia bancaria (SPEI), pago con CoDi, pago con QR, y crédito para tus clientes frecuentes. El formulario se adapta al giro de tu negocio — si solo cobras efectivo, los demás métodos no estorban.',
  },
  {
    q: '¿Mis datos están seguros? ¿Quién puede verlos?',
    a: 'Tus datos son tuyos y solo tuyos. Cada negocio ve únicamente su propia información, la sincronización viaja cifrada y los datos se guardan cifrados. Nunca se venden ni se comparten con terceros, y puedes exportarlos o eliminar tu cuenta cuando quieras.',
  },
  {
    q: '¿Cuánto tiempo toma aprender a usar Xangarro?',
    a: 'Menos de 5 minutos. Si sabes anotar en una libreta, sabes usar Xangarro. No necesitas conocimientos de contabilidad ni de tecnología. La mayoría de los usuarios registran su primera venta en los primeros 2 minutos.',
  },
  {
    q: '¿Puedo usarlo para varios negocios?',
    a: 'Cada negocio tiene su propia cuenta de Xangarro, con su caja, su inventario y su equipo separados, para que los números nunca se mezclen. Si administras varios negocios, creas una cuenta para cada uno.',
  },
  {
    q: '¿Xangarro reemplaza a un contador?',
    a: 'No, y tampoco pretende hacerlo. Xangarro te da visibilidad sobre tu caja diaria y te genera los estados financieros que tu contador necesita, pero no sustituye el asesoramiento fiscal profesional. Piénsalo como la herramienta que hace que las visitas a tu contador sean más rápidas y productivas.',
  },
  {
    q: '¿Cuándo estará disponible Xangarro?',
    a: 'Ya puedes crear tu cuenta gratis en app.xangarro.mx. Estamos abriendo la beta con los primeros negocios: entra, captura y exporta desde hoy; las apps móviles llegan próximamente.',
  },
];

export function StoreBadge({ platform }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--gray-100)',
        color: 'var(--gray-400)',
        border: '2px dashed var(--gray-400)',
        borderRadius: 12,
        padding: '8px 12px',
        opacity: 0.8,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 900 }}>{platform === 'ios' ? '' : '▶'}</div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Próximamente en
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--gray-600)' }}>
          {platform === 'ios' ? 'App Store' : 'Google Play'}
        </span>
      </div>
    </div>
  );
}
