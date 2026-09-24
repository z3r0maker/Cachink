import { Icon } from './icons.jsx';

const TILES = [
  { name: 'Taco al pastor', price: '$22.00', icon: 'flame', tint: 'var(--peach-soft, #FFE8D6)' },
  { name: 'Gringa', price: '$65.00 · ×1', icon: 'sandwich', on: true },
  { name: 'Horchata', price: '$20.00 · ×1', icon: 'cup', on: true },
  { name: 'Quesadilla', price: '$35.00', icon: 'pizza', tint: 'var(--yellow-soft)' },
  { name: 'Refresco', price: '$25.00', icon: 'bottle', tint: 'var(--green-soft)' },
  { name: 'Orden de 5 tacos', price: '$100.00', icon: 'utensils', tint: 'var(--purple-soft, #F0E5FF)' },
];

/** The counter's caja on a phone, mid-sale (decorative). */
export function PhoneMock({ compact = false }) {
  const tiles = compact ? TILES.slice(0, 4) : TILES;
  return (
    <div className="ph">
      <div className="ph-screen">
        <div className="ph-head">
          <div>
            <div className="ph-title">Caja 1</div>
            {compact ? null : <div className="ph-sub">Ana · turno abierto</div>}
          </div>
          {compact ? null : <span className="ph-av">AR</span>}
        </div>
        <div className="ph-grid">
          {tiles.map((t) => (
            <div key={t.name} className={t.on ? 'ph-tile on' : 'ph-tile'}>
              <span className="ph-ico" style={{ background: t.on ? 'var(--white)' : t.tint }}>
                <Icon name={t.icon} />
              </span>
              <span className="ph-name">{t.name}</span>
              {compact ? null : <span className="ph-price num">{t.price}</span>}
            </div>
          ))}
        </div>
        <div className="ph-pay a-pay">Cobrar $85.00</div>
      </div>
    </div>
  );
}
