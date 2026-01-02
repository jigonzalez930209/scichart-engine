/**
 * Tooltip System - High-performance, customizable tooltips for SciChart Engine
 * 
 * This module provides a comprehensive tooltip system with:
 * - Multiple tooltip types (datapoint, crosshair, heatmap, etc.)
 * - Customizable templates
 * - Beautiful predefined themes
 * - Smooth animations
 * - Optimal performance
 * 
 * @module tooltip
 */

// ============================================
// Types
// ============================================

export type {
  // Tooltip Data Types
  TooltipType,
  TooltipData,
  DataPointTooltip,
  CrosshairTooltip,
  CrosshairSeriesValue,
  RangeTooltip,
  RangeStatistics,
  AnnotationTooltip,
  HeatmapTooltip,
  AxisTooltip,
  
  // Positioning
  ArrowPosition,
  TooltipPlacement,
  TooltipPosition,
  TooltipMeasurement,
  
  // Theme
  TooltipTheme,
  TooltipShadow,
  
  // Options
  TooltipOptions,
  DataPointTooltipOptions,
  CrosshairTooltipOptions,
  RangeTooltipOptions,
  AnnotationTooltipOptions,
  HeatmapTooltipOptions,
  TooltipFormatter,
  TooltipFormattedContent,
  TooltipLine,
  
  // Template
  TooltipTemplate,
  
  // Events
  TooltipEventMap,
  TooltipShowEvent,
  TooltipHideEvent,
  TooltipVisibilityEvent,
  TooltipUpdateEvent,
  TooltipMoveEvent,
  
  // Manual API
  ShowTooltipOptions
} from './types';

// ============================================
// Themes
// ============================================

export {
  TOOLTIP_DARK_THEME,
  TOOLTIP_LIGHT_THEME,
  TOOLTIP_GLASS_THEME,
  TOOLTIP_MIDNIGHT_THEME,
  TOOLTIP_ELECTROCHEM_THEME,
  TOOLTIP_NEON_THEME,
  TOOLTIP_MINIMAL_THEME,
  DEFAULT_TOOLTIP_THEME,
  TOOLTIP_THEMES,
  getTooltipTheme,
  createTooltipTheme,
  getTooltipThemeForChartTheme,
  type TooltipThemeName
} from './themes';

// ============================================
// Positioning
// ============================================

export {
  TooltipPositioner,
  createTooltipPositioner,
  DEFAULT_POSITIONER_CONFIG,
  type PositionerConfig
} from './TooltipPositioner';

// ============================================
// Rendering
// ============================================

export {
  TooltipRenderer,
  createTooltipRenderer
} from './TooltipRenderer';

// ============================================
// Manager
// ============================================

export {
  TooltipManager,
  createTooltipManager,
  type TooltipManagerConfig
} from './TooltipManager';

// ============================================
// Templates
// ============================================

export {
  // Template classes
  DefaultTooltipTemplate,
  MinimalTooltipTemplate,
  CrosshairTooltipTemplate,
  HeatmapTooltipTemplate,
  ScientificTooltipTemplate,
  
  // Template instances
  defaultTooltipTemplate,
  minimalTooltipTemplate,
  crosshairTooltipTemplate,
  heatmapTooltipTemplate,
  scientificTooltipTemplate,
  
  // Registry
  BUILTIN_TEMPLATES,
  getBuiltinTemplate,
  getDefaultTemplateForType,
  type BuiltinTemplateId
} from './templates';
