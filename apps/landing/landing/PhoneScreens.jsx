/* Static-render variants of the mobile screens for the landing page.
   These do NOT import from ui_kits — they re-implement the essential
   visual language so the landing page stays self-contained at the root.
   All values come from colors_and_type.css. */

function LandingPhoneFrame({ children, scale = 1 }) {
  return (
    <div
      style={{
        width: 320,
        height: 680,
        position: 'relative',
        borderRadius: 42,
        overflow: 'hidden',
        background: 'var(--offwhite)',
        border: '2.5px solid var(--black)',
        boxShadow: '8px 8px 0 var(--black)',
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* dynamic island */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 96,
          height: 26,
          borderRadius: 18,
          background: 'var(--black)',
          zIndex: 50,
        }}
      />
      <div style={{ height: '100%', overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

function SmallTopBar({ title, subtitle, emblem }) {
  return (
    <div
      style={{
        paddingTop: 52,
        paddingBottom: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '52px 14px 10px',
        background: 'var(--white)',
        borderBottom: '2.5px solid var(--black)',
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 10,
          border: '2px solid var(--black)',
          background: 'var(--yellow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          color: 'var(--black)',
          fontSize: 11,
        }}
      >
        {emblem || 'MR'}
      </div>
      <div style={{ flex: 1, textAlign: 'center' }}>
        <div
          style={{ fontWeight: 900, fontSize: 15, color: 'var(--black)', letterSpacing: '-0.02em' }}
        >
          {title}
        </div>
        <div style={{ fontWeight: 600, fontSize: 10, color: 'var(--gray-600)', marginTop: 1 }}>
          {subtitle}
        </div>
      </div>
      <div style={{ width: 30 }} />
    </div>
  );
}

function SmallTabBar({ items, active }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 56,
        display: 'flex',
        background: 'var(--white)',
        borderTop: '2.5px solid var(--black)',
      }}
    >
      {items.map((it) => (
        <div
          key={it.key}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: active === it.key ? 'var(--yellow)' : 'transparent',
            color: 'var(--black)',
            gap: 2,
          }}
        >
          <div style={{ fontSize: 14 }}>{it.glyph}</div>
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {it.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function StaticTag({ children, variant = 'neutral' }) {
  const V = {
    neutral: ['var(--gray-100)', 'var(--black)'],
    brand: ['var(--yellow)', 'var(--black)'],
    soft: ['var(--yellow-soft)', 'var(--black)'],
    success: ['var(--green-soft)', 'var(--black)'],
    info: ['var(--blue-soft)', 'var(--blue)'],
    danger: ['var(--red-soft)', 'var(--red)'],
    warning: ['var(--warning-soft)', 'var(--black)'],
  }[variant];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: V[0],
        color: V[1],
        border: '2px solid var(--black)',
        borderRadius: 20,
        padding: '2px 8px',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.05em',
      }}
    >
      {children}
    </span>
  );
}

function OperativoStatic() {
  const ventas = [
    { t: 'Pan dulce × 6', h: '07:42', tg: 'Producto', m: 'Efectivo', a: '+$186.00', pos: true },
    {
      t: 'Pastel cumpleaños',
      h: '08:15',
      tg: 'Producto',
      m: 'Transferencia',
      a: '+$780.00',
      pos: true,
    },
    { t: 'Harina (25kg)', h: '09:02', tg: 'Insumo', m: 'Efectivo', a: '−$640.00', pos: false },
    { t: 'Café mesa 4', h: '10:24', tg: 'Producto', m: 'Efectivo', a: '+$145.00', pos: true },
  ];
  return (
    <div style={{ height: '100%', position: 'relative', background: 'var(--offwhite)' }}>
      <SmallTopBar title="Xangarro" subtitle="Panadería La Esquina" />
      <div style={{ padding: '12px 12px 66px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          style={{
            background: 'var(--yellow)',
            border: '2px solid var(--black)',
            borderRadius: 14,
            boxShadow: '4px 4px 0 var(--black)',
            padding: '14px 14px 12px',
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--gray-600)',
            }}
          >
            Ventas hoy · 24 abr
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: '-0.04em',
              color: 'var(--black)',
              marginTop: 2,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            $1,321.00
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--black)',
                  opacity: 0.65,
                }}
              >
                Egresos
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: 'var(--black)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                $640.00
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--black)',
                  opacity: 0.65,
                }}
              >
                Neto
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: 'var(--black)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                $681.00
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div
            style={{
              flex: 1,
              height: 36,
              border: '2px solid var(--black)',
              borderRadius: 10,
              background: 'var(--black)',
              color: 'var(--white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              boxShadow: '4px 4px 0 var(--black)',
            }}
          >
            + VENTA
          </div>
          <div
            style={{
              flex: 1,
              height: 36,
              border: '2px solid var(--black)',
              borderRadius: 10,
              background: 'var(--yellow-soft)',
              color: 'var(--black)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              boxShadow: '3px 3px 0 var(--black)',
            }}
          >
            + EGRESO
          </div>
        </div>

        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--gray-600)',
            marginTop: 4,
          }}
        >
          Movimientos de hoy
        </div>
        {ventas.map((v, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              background: 'var(--white)',
              border: '2px solid var(--black)',
              borderRadius: 14,
              boxShadow: '3px 3px 0 var(--black)',
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                background: v.pos ? 'var(--yellow-soft)' : 'var(--red-soft)',
                border: '2px solid var(--black)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              {v.pos ? '$' : '−'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--black)' }}>{v.t}</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                <StaticTag variant="neutral">{v.tg}</StaticTag>
                <StaticTag variant={v.m === 'Efectivo' ? 'brand' : 'info'}>{v.m}</StaticTag>
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: v.pos ? 'var(--green)' : 'var(--red)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {v.a}
            </div>
          </div>
        ))}
      </div>
      <SmallTabBar
        active="home"
        items={[
          { key: 'home', label: 'Inicio', glyph: '⌂' },
          { key: 'ventas', label: 'Ventas', glyph: '$' },
          { key: 'corte', label: 'Corte', glyph: '▤' },
          { key: 'ajustes', label: 'Ajustes', glyph: '⚙' },
        ]}
      />
    </div>
  );
}

function DirectorStatic() {
  const cxc = [
    { n: 'Café del Parque', d: 'Vence en 2 días', a: '$8,400', t: 'warning', lab: 'Pendiente' },
    { n: 'Hotel Centro', d: 'Vencida · 5 días', a: '$14,200', t: 'danger', lab: 'Vencida' },
    { n: 'Escuela Benavente', d: 'Vence en 12 días', a: '$18,700', t: 'neutral', lab: 'Al día' },
  ];
  return (
    <div style={{ height: '100%', position: 'relative', background: 'var(--offwhite)' }}>
      <SmallTopBar title="Dirección" subtitle="La Esquina · Abril" emblem="DIR" />
      <div style={{ padding: '12px 12px 66px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          style={{
            background: 'var(--black)',
            border: '2.5px solid var(--black)',
            borderRadius: 14,
            boxShadow: '5px 5px 0 var(--black)',
            padding: '14px',
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#D6D6D2',
            }}
          >
            Utilidad neta · mes
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
              letterSpacing: '-0.04em',
              color: 'var(--white)',
              marginTop: 2,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            $184,320
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <StaticTag variant="success">+18% vs. marzo</StaticTag>
            <StaticTag variant="soft">Meta 92%</StaticTag>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            ['Ventas mes', '$486k', 'var(--green)'],
            ['Egresos', '$302k', 'var(--black)'],
            ['CxC', '$48.3k', 'var(--black)'],
            ['Efectivo', '$92.1k', 'var(--green)'],
          ].map(([l, v, c], i) => (
            <div
              key={i}
              style={{
                background: 'var(--white)',
                border: '2px solid var(--black)',
                borderRadius: 14,
                boxShadow: '3px 3px 0 var(--black)',
                padding: '10px 10px',
              }}
            >
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--gray-600)',
                }}
              >
                {l}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  color: c,
                  fontVariantNumeric: 'tabular-nums',
                  marginTop: 2,
                }}
              >
                {v}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: 'var(--white)',
            border: '2px solid var(--black)',
            borderRadius: 14,
            boxShadow: '3px 3px 0 var(--black)',
            padding: '10px',
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--gray-600)',
              marginBottom: 8,
            }}
          >
            Salud financiera
          </div>
          {[
            ['Margen bruto', 62, 'var(--green)', '62%'],
            ['Liquidez', 60, 'var(--warning)', '1.8 / 3'],
            ['Meta mes', 92, 'var(--yellow)', '92%'],
          ].map(([l, p, c, v], i) => (
            <div key={i} style={{ marginBottom: i < 2 ? 8 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--black)' }}>{l}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-600)' }}>{v}</span>
              </div>
              <div
                style={{
                  height: 10,
                  background: 'var(--gray-100)',
                  border: '2px solid var(--black)',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <div style={{ height: '100%', width: `${p}%`, background: c }} />
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--gray-600)',
            marginTop: 2,
          }}
        >
          Cuentas por cobrar
        </div>
        {cxc.map((c, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              background: 'var(--white)',
              border: '2px solid var(--black)',
              borderRadius: 14,
              boxShadow: '3px 3px 0 var(--black)',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--black)' }}>{c.n}</div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: c.t === 'danger' ? 'var(--red)' : 'var(--gray-600)',
                  marginTop: 2,
                }}
              >
                {c.d}
              </div>
            </div>
            <StaticTag variant={c.t}>{c.lab}</StaticTag>
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: 'var(--black)',
                fontVariantNumeric: 'tabular-nums',
                minWidth: 52,
                textAlign: 'right',
              }}
            >
              {c.a}
            </div>
          </div>
        ))}
      </div>
      <SmallTabBar
        active="home"
        items={[
          { key: 'home', label: 'Panel', glyph: '▥' },
          { key: 'cxc', label: 'CxC', glyph: '$' },
          { key: 'stock', label: 'Stock', glyph: '▣' },
          { key: 'ajustes', label: 'Ajustes', glyph: '⚙' },
        ]}
      />
    </div>
  );
}

function NuevaVentaStatic() {
  return (
    <div style={{ height: '100%', position: 'relative', background: 'var(--offwhite)' }}>
      <SmallTopBar title="Nueva venta" subtitle="24 abr · 10:48" />
      <div style={{ padding: '14px 14px 14px' }}>
        {[
          { l: 'MONTO (MXN)', v: '$1,240.00', n: 'Sin IVA. Se redondea al guardar.' },
          { l: 'CONCEPTO', v: 'Pan dulce × 4' },
          { l: 'CATEGORÍA', v: 'Producto ▾' },
        ].map((f, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--gray-600)',
                marginBottom: 4,
              }}
            >
              {f.l}
            </div>
            <div
              style={{
                background: 'var(--white)',
                border: '2px solid var(--black)',
                borderRadius: 12,
                padding: '10px 12px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              {f.v}
            </div>
            {f.n && (
              <div style={{ fontSize: 9, color: 'var(--gray-400)', fontWeight: 500, marginTop: 3 }}>
                {f.n}
              </div>
            )}
          </div>
        ))}

        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--gray-600)',
            marginBottom: 6,
          }}
        >
          MÉTODO DE PAGO
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            ['Efectivo', true],
            ['Transfer.', false],
            ['Tarjeta', false],
          ].map(([m, sel], i) => (
            <div
              key={i}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '9px 0',
                border: '2px solid var(--black)',
                borderRadius: 12,
                background: sel ? 'var(--yellow)' : 'var(--white)',
                fontWeight: 700,
                fontSize: 11,
                color: 'var(--black)',
                boxShadow: sel ? '3px 3px 0 var(--black)' : 'none',
              }}
            >
              {m}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '11px 0',
              border: '2px solid var(--black)',
              borderRadius: 10,
              background: 'transparent',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Cancelar
          </div>
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '11px 0',
              border: '2px solid var(--black)',
              borderRadius: 10,
              background: 'var(--yellow)',
              boxShadow: '4px 4px 0 var(--black)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--black)',
            }}
          >
            Guardar
          </div>
        </div>
      </div>
    </div>
  );
}

export { LandingPhoneFrame, OperativoStatic, DirectorStatic, NuevaVentaStatic };
