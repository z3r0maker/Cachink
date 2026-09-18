/**
 * Shared copy + primitive UI bits used across landing sections.
 * Single source of truth — FAQs are also exported from here so
 * structured-data.js and the visible FAQ component stay in sync.
 */
import { useState } from 'react';

/* ─────────────── Copy decks for the 3 tones ─────────────── */
export const TONE_COPY = {
  punchy: {
    eyebrow: '¡CACHINK! · FINANZAS CLARAS',
    h1a: 'Tu caja, clara.',
    h1b: 'Cada día.',
    sub: 'Registra ventas y egresos en 3 segundos. Ve lo que ganas hoy, sin hojas de Excel ni contadores.',
    cta1: 'Entrar a la lista',
    cta2: 'Ver cómo funciona',
    why: [
      { t: 'Tres segundos por venta', d: 'Abres, anotas, listo. Sin menús anidados.' },
      { t: 'Offline siempre', d: 'Aunque se caiga el internet, tu caja no para.' },
      { t: 'Sin suscripciones infinitas', d: 'Un plan gratis generoso, un plan pro honesto.' },
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
    eyebrow: 'CACHINK · CONTROL FINANCIERO PARA NEGOCIOS PEQUEÑOS',
    h1a: 'Deja de adivinar',
    h1b: 'cuánto ganaste hoy.',
    sub: 'Cachink es una app mexicana pensada para dueños de negocios pequeños. Registras lo que entra y lo que sale, y ella te dice — en español y en pesos — cómo va tu negocio de verdad.',
    cta1: 'Quiero probarla cuando salga',
    cta2: 'Conocer los módulos',
    why: [
      {
        t: 'Pensada en español, para México',
        d: 'IVA, NIF, CFDI, MXN. No traducimos software gringo.',
      },
      { t: 'Tu información es tuya', d: 'Los datos viven en tu dispositivo. La nube es opcional.' },
      {
        t: 'Tan simple como una libreta',
        d: 'Si sabes anotar en una libreta, sabes usar Cachink.',
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
        t: 'Cachink hace las cuentas',
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
    eyebrow: '¡CACHINK! · EL SONIDO DE QUE TU NEGOCIO VA BIEN',
    h1a: '¡Cachink!',
    h1b: 'Sonó otra venta.',
    sub: 'La app más honesta para llevar la caja de tu negocio. Sin Excel, sin drama, sin inglés de software caro.',
    cta1: 'Avísame cuando salga',
    cta2: 'Ver la demo',
    why: [
      { t: 'Rápida como la caja registradora', d: 'Un toque. ¡Cachink! Venta guardada.' },
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
    q: '¿Para quién es Cachink?',
    a: 'Cachink es para dueños de pequeños negocios en México: panaderías, cafeterías, tiendas de barrio, talleres mecánicos, consultorios y cualquier negocio que maneje caja diaria. Si llevas el control de ventas en una libreta o en tu cabeza, Cachink está hecho para ti.',
  },
  {
    q: '¿Cómo funciona Cachink?',
    a: 'Registras cada venta o egreso en menos de 3 segundos: monto, concepto y método de pago. La app calcula automáticamente tus ventas del día, del mes y el efectivo disponible en caja. Al final del mes puedes exportar un estado financiero completo para tu contador, sin necesidad de capturar nada extra.',
  },
  {
    q: '¿Funciona sin internet?',
    a: 'Sí. Cachink es offline-first: todos tus datos se guardan en tu dispositivo y la app funciona aunque no tengas señal. Cuando vuelve la conexión, la información se sincroniza automáticamente con tus otros dispositivos si tienes el Plan Pro o Contador.',
  },
  {
    q: '¿Cuánto cuesta Cachink?',
    a: 'El Plan Gratis es $0 para siempre e incluye ventas y egresos ilimitados en 1 dispositivo, corte de día y exportación a CSV. El Plan Pro cuesta $149 MXN al mes e incluye multi-dispositivo sincronizado, Panel Director y estados financieros NIF. El Plan Contador cuesta $299 MXN al mes e incluye hasta 10 negocios, exportación fiscal y multi-usuario con permisos.',
  },
  {
    q: '¿En qué dispositivos está disponible?',
    a: 'Cachink está disponible en iOS (iPhone) y Android. Puedes usarlo en tu teléfono principal y, con el Plan Pro o Contador, sincronizarlo con tablets y otros teléfonos del negocio en tiempo real.',
  },
  {
    q: '¿Es una alternativa a Excel para llevar las cuentas del negocio?',
    a: 'Sí, y mucho más simple. Con Excel necesitas crear fórmulas, mantener hojas actualizadas y calcular totales a mano. Cachink registra cada venta en segundos, calcula los totales automáticamente y genera reportes listos para tu contador, sin que tengas que saber de hojas de cálculo.',
  },
  {
    q: '¿Puedo compartir los estados financieros con mi contador?',
    a: 'Sí. Con el Plan Pro y Contador puedes exportar estados financieros en formato NIF (Normas de Información Financiera), el estándar que usan los contadores en México. El archivo se genera con un toque y puedes enviarlo por correo o WhatsApp directamente desde la app.',
  },
  {
    q: '¿Cachink maneja CFDI o facturación electrónica?',
    a: 'Cachink está enfocado en el control de caja y estados financieros internos, no en la emisión de CFDI. Si necesitas facturar, puedes usar tu herramienta de facturación actual y registrar el egreso o ingreso correspondiente en Cachink para mantener tu caja cuadrada.',
  },
  {
    q: '¿Qué métodos de pago puedo registrar?',
    a: 'Puedes registrar ventas en efectivo, tarjeta de débito o crédito, transferencia bancaria (SPEI), pago con CoDi, pago con QR, y cualquier método personalizado que definas. El formulario se adapta al giro de tu negocio — si solo cobras efectivo, los demás métodos no estorban.',
  },
  {
    q: '¿Mis datos están seguros? ¿Quién puede verlos?',
    a: 'Tus datos son tuyos y solo tuyos. Cachink es offline-first: la información vive en tu dispositivo y nunca se vende ni se comparte con terceros. La sincronización en la nube (Plan Pro y Contador) usa cifrado en tránsito y en reposo. Ningún empleado de Cachink puede ver tus números.',
  },
  {
    q: '¿Cuánto tiempo toma aprender a usar Cachink?',
    a: 'Menos de 5 minutos. Si sabes anotar en una libreta, sabes usar Cachink. No necesitas conocimientos de contabilidad ni de tecnología. La mayoría de usuarios registran su primera venta en los primeros 2 minutos de abrir la app.',
  },
  {
    q: '¿Puedo usarlo para varios negocios?',
    a: 'Sí. Con el Plan Contador puedes gestionar hasta 10 negocios desde una sola cuenta, con cajas completamente separadas para cada uno. Es ideal para contadores, administradores o emprendedores que tienen más de un punto de venta.',
  },
  {
    q: '¿Cachink reemplaza a un contador?',
    a: 'No, y tampoco pretende hacerlo. Cachink te da visibilidad sobre tu caja diaria y te genera los estados financieros que tu contador necesita, pero no sustituye el asesoramiento fiscal profesional. Piénsalo como la herramienta que hace que las visitas a tu contador sean más rápidas y productivas.',
  },
  {
    q: '¿Cuándo estará disponible Cachink?',
    a: 'Cachink lanza en verano de 2026 para iOS y Android. Únete a la lista de espera y te avisamos el día del lanzamiento. Los primeros en registrarse tendrán 3 meses gratis en cualquier plan de pago.',
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
