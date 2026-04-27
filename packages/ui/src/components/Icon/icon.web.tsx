/**
 * Icon — desktop / web (Tauri) + Storybook + Vitest variant.
 *
 * Vite-based tools resolve this file via the default import chain
 * `./icon.tsx → ./icon.web.tsx`. Metro ignores it and picks
 * `./icon.native.tsx` on mobile.
 *
 * Maps the curated `IconName` union (see `./icon.tsx`) onto concrete
 * `lucide-react` components. The map is exhaustive — TypeScript catches
 * a missing entry as a compile error instead of a runtime crash.
 *
 * Why a map instead of dynamic require: tree-shaking. Every named import
 * lands in the bundle as a separate chunk so unused icons fall away in
 * production builds.
 */
import type { ReactElement } from 'react';
import {
  Archive,
  Banknote,
  Bell,
  Building2,
  Cake,
  Calendar,
  Camera,
  ChartBar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  ClipboardList,
  Cloud,
  Coins,
  CreditCard,
  DollarSign,
  Ellipsis,
  Eye,
  EyeOff,
  FileText,
  HandCoins,
  HardDrive,
  Home,
  Info,
  LayoutDashboard,
  LayoutGrid,
  Minus,
  Monitor,
  Package,
  Pencil,
  Plug,
  Plus,
  Receipt,
  ScanBarcode,
  Search,
  Settings,
  Share2,
  ShoppingBag,
  Smartphone,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  User,
  Users,
  Utensils,
  Wallet,
  X,
} from 'lucide-react';
import type { IconName, IconProps } from './icon.shared';
import { ICON_DEFAULT_SIZE, ICON_DEFAULT_STROKE } from './icon.shared';

export type IconElement = ReactElement;

/**
 * Exhaustive map of `IconName` → Lucide component. Compile fails when a
 * `IconName` value is added without a matching entry here, surfacing
 * the gap before runtime.
 */
const ICONS: Record<IconName, typeof Home> = {
  home: Home,
  'layout-dashboard': LayoutDashboard,
  'layout-grid': LayoutGrid,
  settings: Settings,
  ellipsis: Ellipsis,
  'dollar-sign': DollarSign,
  banknote: Banknote,
  wallet: Wallet,
  coins: Coins,
  'hand-coins': HandCoins,
  'credit-card': CreditCard,
  receipt: Receipt,
  archive: Archive,
  package: Package,
  'scan-barcode': ScanBarcode,
  'shopping-bag': ShoppingBag,
  'chart-bar': ChartBar,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  plus: Plus,
  minus: Minus,
  x: X,
  check: Check,
  'share-2': Share2,
  pencil: Pencil,
  'trash-2': Trash2,
  users: Users,
  user: User,
  bell: Bell,
  'circle-alert': CircleAlert,
  info: Info,
  'file-text': FileText,
  // Form affordances
  eye: Eye,
  'eye-off': EyeOff,
  camera: Camera,
  calendar: Calendar,
  search: Search,
  // Wizard / help-modal scenarios
  smartphone: Smartphone,
  'building-2': Building2,
  cake: Cake,
  truck: Truck,
  utensils: Utensils,
  'clipboard-list': ClipboardList,
  // Wizard step 2/2A/2B/3 mode-pickers
  'hard-drive': HardDrive,
  cloud: Cloud,
  plug: Plug,
  monitor: Monitor,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
};

/**
 * Renders a brand-curated icon. See `icon.stories.tsx` for the full
 * matrix.
 */
export function Icon(props: IconProps): IconElement {
  const Glyph = ICONS[props.name];
  const size = props.size ?? ICON_DEFAULT_SIZE;
  const strokeWidth = props.strokeWidth ?? ICON_DEFAULT_STROKE;
  const color = props.color ?? 'currentColor';
  const decorative = props.ariaLabel === undefined;

  return (
    <Glyph
      data-testid={props.testID ?? `icon-${props.name}`}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      aria-hidden={decorative ? 'true' : undefined}
      aria-label={decorative ? undefined : props.ariaLabel}
      role={decorative ? undefined : 'img'}
    />
  );
}
