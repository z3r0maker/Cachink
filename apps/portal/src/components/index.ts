/**
 * The portal's closed component vocabulary.
 *
 * Design plan §6: "Antes de crear un componente nuevo, buscar el existente en
 * el inventario de la fase 1." Add to this barrel rather than growing a
 * one-off inside a screen.
 */
export { Button, type ButtonProps } from './button';
export { Card, type CardProps } from './card';
export { Tag, StatusPill, type TagProps, type Tone } from './tag';
export { Input, type InputProps } from './input';
export {
  EmptyState,
  ErrorState,
  LoadingState,
  type EmptyStateProps,
  type ErrorStateProps,
  type LoadingStateProps,
} from './states';
export { KpiCard, Delta, Verdict, type KpiCardProps, type FigureTone } from './kpi';
export { kpiGrid } from './kpi.css';
export { SegmentedTabs, FilterChip, type TabDef, type SegmentedTabsProps } from './tabs';
export { DataTable, type ColumnDef, type DataTableProps } from './table';
export { Banner, type BannerProps } from './banner';
export { Drawer, type DrawerProps } from './drawer';
export { ScreenBody, type ScreenBodyProps } from './screen';
export {
  LockedState,
  ProximamenteState,
  type LockedStateProps,
  type ProximamenteStateProps,
} from './gated-states';
export { OptionCards, type OptionDef, type OptionCardsProps } from './option-card';
export { UsageBar, type UsageBarProps } from './usage-bar';
export { Switch, type SwitchProps } from './switch';
export { ConfirmDialog, type ConfirmDialogProps } from './dialog';
export { Seal, type SealLevel, type SealProps } from './seal';
export { sealPath } from './seal-path';
export { Celebration, type CelebrationProps } from './celebration';
export * from './export-button';
export * from './pending-button';
