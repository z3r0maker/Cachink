'use client';

import { colors, portalFontSizes } from '@xangarro/tokens';

import { Input } from '@/components';

/** The logo upload row and the colour picker (N-19), split out for size. */

export function LogoCard({
  logoUrl,
  mayWrite,
  subiendo,
  onFile,
}: {
  readonly logoUrl: string | null;
  readonly mayWrite: boolean;
  readonly subiendo: boolean;
  readonly onFile: (f: File | null) => void;
}) {
  return (
    <div
      style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginTop: 16 }}
    >
      {logoUrl !== null ? (
        <img
          src={logoUrl}
          alt="Tu logo"
          data-testid="comprobantes-logo"
          style={{ maxHeight: 72, maxWidth: 220, objectFit: 'contain' }}
        />
      ) : (
        <span style={{ fontWeight: 800, fontSize: portalFontSizes.cardTitle }}>
          Sin logo todavía
        </span>
      )}
      {mayWrite ? (
        <SubirLogoLabel subiendo={subiendo} hasLogo={logoUrl !== null} onFile={onFile} />
      ) : null}
      <span style={{ color: 'var(--gray-600)', fontSize: portalFontSizes.sm }}>
        PNG, JPG o SVG · hasta 2 MB
      </span>
    </div>
  );
}

export function ColorRow({
  value,
  disabled,
  onPick,
}: {
  readonly value: string;
  readonly disabled: boolean;
  readonly onPick: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <input
        type="color"
        aria-label="Color de la marca"
        disabled={disabled}
        value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : colors.yellow}
        onChange={(e) => onPick(e.target.value)}
        style={{
          width: 44,
          height: 44,
          border: '2px solid var(--black)',
          borderRadius: 10,
          padding: 2,
        }}
      />
      <Input
        labelText="Color de la marca"
        value={value}
        disabled={disabled}
        onChange={(e) => onPick(e.target.value)}
      />
    </div>
  );
}

function SubirLogoLabel({
  subiendo,
  hasLogo,
  onFile,
}: {
  readonly subiendo: boolean;
  readonly hasLogo: boolean;
  readonly onFile: (f: File | null) => void;
}) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        border: '2px solid var(--black)',
        borderRadius: 10,
        padding: '8px 14px',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {subiendo ? 'Subiendo…' : hasLogo ? 'Cambiar logo' : 'Subir logo'}
      <input
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        style={{ display: 'none' }}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}
