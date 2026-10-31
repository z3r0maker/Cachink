import type { EmpresaEntryId } from './empresa-nav';
import type { NavHref } from './nav-items';

/** Lucide-shaped stroke icons for the console (stroke 2.2, 24×24). */
export const NAV_ICONS: Readonly<Record<NavHref, string>> = {
  '/': 'M3 11l9-8 9 8M5 10v10h14V10',
  '/tenants': 'M4 21V8l8-5 8 5v13M9 21v-6h6v6',
  '/uso': 'M4 20V10M10 20V4M16 20v-8M22 20H2',
  '/inbox': 'M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13L22 12v7H2v-7z',
  '/flags': 'M5 22V4m0 0h11l-2 4 2 4H5',
  '/mapa': 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  '/campanas': 'M3 11v2l13 5V6L3 11zm13-5 5-2v16l-5-2',
  '/capacidad':
    'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zm0 0v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
};

/** The «Empresa» rail entries (plan §2): one icon per question. */
export const EMPRESA_ICONS: Readonly<Record<EmpresaEntryId, string>> = {
  dinero: 'M2 6h20v12H2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 12h.01M18 12h.01',
  resultados: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  socios:
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.1a4 4 0 0 1 0 7.8M22 21v-1a6 6 0 0 0-4-5.6',
  cumplimiento:
    'M9 3h6v4H9zM9 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-3M9 14l2 2 4-4',
};

export const SEARCH_ICON = 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm9 2-3.5-3.5';

export function Icon({ d, size = 18 }: { readonly d: string; readonly size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
