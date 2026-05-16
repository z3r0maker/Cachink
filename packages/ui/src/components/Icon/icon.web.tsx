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
  Apple,
  Archive,
  Armchair,
  ArrowDownUp,
  Banknote,
  Bath,
  Beef,
  Beer,
  Bell,
  Book,
  Box,
  Briefcase,
  Building2,
  Cake,
  Calendar,
  Camera,
  Candy,
  Car,
  ChartBar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleHelp,
  CircleX,
  ClipboardList,
  Cloud,
  Coffee,
  Coins,
  Cookie,
  CreditCard,
  Croissant,
  CupSoda,
  DollarSign,
  Droplets,
  Drumstick,
  Egg,
  Ellipsis,
  Eye,
  EyeOff,
  FileText,
  Fish,
  Flower2,
  Gem,
  Gift,
  GlassWater,
  Grape,
  Hammer,
  HandCoins,
  HardDrive,
  HardHat,
  Heart,
  Home,
  IceCreamCone,
  Inbox,
  Info,
  Lamp,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  Leaf,
  Lock,
  Martini,
  Milk,
  Minus,
  Monitor,
  Music,
  Nut,
  Package,
  Paintbrush,
  Palette,
  PawPrint,
  Pencil,
  PenTool,
  Pill,
  Pizza,
  Plug,
  Plus,
  Popcorn,
  Printer,
  Receipt,
  RefreshCw,
  Salad,
  Sandwich,
  ScanBarcode,
  Scissors,
  Search,
  Settings,
  Share2,
  Shirt,
  SportShoe,
  ShoppingBag,
  ShoppingCart,
  Sliders,
  Smartphone,
  Soup,
  Sparkles,
  SprayCan,
  Star,
  Stethoscope,
  Store,
  Sun,
  Tag,
  Ticket,
  Trash2,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Trophy,
  Truck,
  User,
  UserCheck,
  Users,
  Utensils,
  Wallet,
  Watch,
  Wine,
  Wrench,
  X,
  Zap,
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
  'shopping-cart': ShoppingCart,
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
  'user-check': UserCheck,
  bell: Bell,
  'circle-alert': CircleAlert,
  'circle-help': CircleHelp,
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
  // Feature flags + system modules (Phase 4)
  inbox: Inbox,
  'refresh-cw': RefreshCw,
  zap: Zap,
  sliders: Sliders,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  // Caja Completa
  landmark: Landmark,
  'arrow-down-up': ArrowDownUp,
  'circle-x': CircleX,
  lock: Lock,
  'triangle-alert': TriangleAlert,
  // Product icons — Alimentos
  beef: Beef,
  apple: Apple,
  candy: Candy,
  cookie: Cookie,
  croissant: Croissant,
  drumstick: Drumstick,
  egg: Egg,
  fish: Fish,
  'ice-cream-cone': IceCreamCone,
  leaf: Leaf,
  nut: Nut,
  pizza: Pizza,
  popcorn: Popcorn,
  salad: Salad,
  sandwich: Sandwich,
  soup: Soup,
  // Product icons — Bebidas
  beer: Beer,
  coffee: Coffee,
  'cup-soda': CupSoda,
  'glass-water': GlassWater,
  grape: Grape,
  martini: Martini,
  milk: Milk,
  wine: Wine,
  // Product icons — Comercio
  gift: Gift,
  gem: Gem,
  shirt: Shirt,
  'sport-shoe': SportShoe,
  store: Store,
  tag: Tag,
  watch: Watch,
  // Product icons — Servicios
  car: Car,
  hammer: Hammer,
  'hard-hat': HardHat,
  paintbrush: Paintbrush,
  scissors: Scissors,
  'spray-can': SprayCan,
  stethoscope: Stethoscope,
  wrench: Wrench,
  // Product icons — Belleza & Cuidado
  bath: Bath,
  sparkles: Sparkles,
  sun: Sun,
  droplets: Droplets,
  heart: Heart,
  // Product icons — Hogar & Oficina
  armchair: Armchair,
  book: Book,
  briefcase: Briefcase,
  lamp: Lamp,
  'pen-tool': PenTool,
  printer: Printer,
  // Product icons — General
  box: Box,
  'flower-2': Flower2,
  music: Music,
  palette: Palette,
  'paw-print': PawPrint,
  pill: Pill,
  star: Star,
  ticket: Ticket,
  trophy: Trophy,
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
