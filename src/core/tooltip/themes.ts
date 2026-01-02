/**
 * Tooltip Themes - Predefined visual styles for tooltips
 * 
 * This module provides beautiful, high-quality tooltip themes that
 * integrate seamlessly with the chart theme system.
 * 
 * @module tooltip/themes
 */

import type { TooltipTheme } from './types';

// ============================================
// Base Defaults
// ============================================

const DEFAULT_PADDING = {
  top: 10,
  right: 12,
  bottom: 10,
  left: 12
};

// ============================================
// Dark Theme
// ============================================

/**
 * Dark Theme - Elegant dark tooltip with subtle glow
 */
export const TOOLTIP_DARK_THEME: TooltipTheme = {
  // Container
  backgroundColor: 'rgba(15, 18, 25, 0.95)',
  backgroundGradient: 'rgba(25, 30, 40, 0.90)',
  borderColor: 'rgba(255, 255, 255, 0.12)',
  borderWidth: 1,
  borderRadius: 8,
  backdropBlur: 12,
  shadow: {
    color: 'rgba(0, 0, 0, 0.4)',
    offsetX: 0,
    offsetY: 4,
    blur: 16
  },
  
  // Typography
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  textColor: '#ffffff',
  textSecondaryColor: 'rgba(255, 255, 255, 0.6)',
  titleFontSize: 12,
  titleFontWeight: 600,
  contentFontSize: 11,
  lineHeight: 1.4,
  
  // Spacing
  padding: DEFAULT_PADDING,
  itemGap: 4,
  headerGap: 8,
  
  // Decorations
  showSeriesIndicator: true,
  seriesIndicatorSize: 8,
  showHeaderSeparator: true,
  separatorColor: 'rgba(255, 255, 255, 0.1)',
  showArrow: true,
  arrowSize: 6
};

// ============================================
// Light Theme
// ============================================

/**
 * Light Theme - Clean and professional for light backgrounds
 */
export const TOOLTIP_LIGHT_THEME: TooltipTheme = {
  // Container
  backgroundColor: 'rgba(255, 255, 255, 0.98)',
  borderColor: 'rgba(0, 0, 0, 0.12)',
  borderWidth: 1,
  borderRadius: 8,
  backdropBlur: 8,
  shadow: {
    color: 'rgba(0, 0, 0, 0.12)',
    offsetX: 0,
    offsetY: 4,
    blur: 12
  },
  
  // Typography
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  textColor: '#1a1a1a',
  textSecondaryColor: 'rgba(0, 0, 0, 0.55)',
  titleFontSize: 12,
  titleFontWeight: 600,
  contentFontSize: 11,
  lineHeight: 1.4,
  
  // Spacing
  padding: DEFAULT_PADDING,
  itemGap: 4,
  headerGap: 8,
  
  // Decorations
  showSeriesIndicator: true,
  seriesIndicatorSize: 8,
  showHeaderSeparator: true,
  separatorColor: 'rgba(0, 0, 0, 0.08)',
  showArrow: true,
  arrowSize: 6
};

// ============================================
// Glassmorphism Theme
// ============================================

/**
 * Glassmorphism Theme - Modern frosted glass effect
 */
export const TOOLTIP_GLASS_THEME: TooltipTheme = {
  // Container
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  backgroundGradient: 'rgba(255, 255, 255, 0.04)',
  borderColor: 'rgba(255, 255, 255, 0.2)',
  borderWidth: 1,
  borderRadius: 12,
  backdropBlur: 20,
  shadow: {
    color: 'rgba(0, 0, 0, 0.3)',
    offsetX: 0,
    offsetY: 8,
    blur: 32
  },
  
  // Typography
  fontFamily: 'Inter, system-ui, sans-serif',
  textColor: 'rgba(255, 255, 255, 0.95)',
  textSecondaryColor: 'rgba(255, 255, 255, 0.6)',
  titleFontSize: 12,
  titleFontWeight: 600,
  contentFontSize: 11,
  lineHeight: 1.5,
  
  // Spacing
  padding: { top: 12, right: 14, bottom: 12, left: 14 },
  itemGap: 5,
  headerGap: 10,
  
  // Decorations
  showSeriesIndicator: true,
  seriesIndicatorSize: 8,
  showHeaderSeparator: true,
  separatorColor: 'rgba(255, 255, 255, 0.15)',
  showArrow: true,
  arrowSize: 7
};

// ============================================
// Midnight Theme
// ============================================

/**
 * Midnight Theme - Deep blue tones for night mode
 */
export const TOOLTIP_MIDNIGHT_THEME: TooltipTheme = {
  // Container
  backgroundColor: 'rgba(10, 15, 30, 0.95)',
  backgroundGradient: 'rgba(20, 25, 50, 0.90)',
  borderColor: 'rgba(100, 120, 255, 0.25)',
  borderWidth: 1,
  borderRadius: 8,
  backdropBlur: 15,
  shadow: {
    color: 'rgba(50, 70, 150, 0.25)',
    offsetX: 0,
    offsetY: 4,
    blur: 20
  },
  
  // Typography
  fontFamily: 'Inter, system-ui, sans-serif',
  textColor: '#e0e8ff',
  textSecondaryColor: 'rgba(180, 190, 255, 0.6)',
  titleFontSize: 12,
  titleFontWeight: 600,
  contentFontSize: 11,
  lineHeight: 1.4,
  
  // Spacing
  padding: DEFAULT_PADDING,
  itemGap: 4,
  headerGap: 8,
  
  // Decorations
  showSeriesIndicator: true,
  seriesIndicatorSize: 8,
  showHeaderSeparator: true,
  separatorColor: 'rgba(100, 120, 255, 0.15)',
  showArrow: true,
  arrowSize: 6
};

// ============================================
// Electrochemistry Theme
// ============================================

/**
 * Electrochemistry Theme - Professional blue tones for scientific data
 */
export const TOOLTIP_ELECTROCHEM_THEME: TooltipTheme = {
  // Container
  backgroundColor: 'rgba(8, 20, 40, 0.96)',
  backgroundGradient: 'rgba(15, 35, 60, 0.92)',
  borderColor: 'rgba(30, 136, 229, 0.35)',
  borderWidth: 1,
  borderRadius: 6,
  backdropBlur: 10,
  shadow: {
    color: 'rgba(30, 136, 229, 0.2)',
    offsetX: 0,
    offsetY: 4,
    blur: 16
  },
  
  // Typography
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  textColor: '#bbdefb',
  textSecondaryColor: 'rgba(144, 202, 249, 0.7)',
  titleFontSize: 11,
  titleFontWeight: 600,
  contentFontSize: 11,
  lineHeight: 1.5,
  
  // Spacing
  padding: { top: 8, right: 10, bottom: 8, left: 10 },
  itemGap: 3,
  headerGap: 6,
  
  // Decorations
  showSeriesIndicator: true,
  seriesIndicatorSize: 6,
  showHeaderSeparator: true,
  separatorColor: 'rgba(30, 136, 229, 0.2)',
  showArrow: true,
  arrowSize: 5
};

// ============================================
// Neon Theme
// ============================================

/**
 * Neon Theme - Vibrant glowing effect for futuristic UIs
 */
export const TOOLTIP_NEON_THEME: TooltipTheme = {
  // Container
  backgroundColor: 'rgba(0, 0, 0, 0.92)',
  borderColor: '#00ffff',
  borderWidth: 1,
  borderRadius: 4,
  backdropBlur: 0,
  shadow: {
    color: 'rgba(0, 255, 255, 0.35)',
    offsetX: 0,
    offsetY: 0,
    blur: 20
  },
  
  // Typography
  fontFamily: '"Orbitron", "Exo 2", sans-serif',
  textColor: '#00ffff',
  textSecondaryColor: 'rgba(0, 255, 255, 0.6)',
  titleFontSize: 11,
  titleFontWeight: 700,
  contentFontSize: 10,
  lineHeight: 1.4,
  
  // Spacing
  padding: { top: 8, right: 12, bottom: 8, left: 12 },
  itemGap: 4,
  headerGap: 6,
  
  // Decorations
  showSeriesIndicator: true,
  seriesIndicatorSize: 6,
  showHeaderSeparator: true,
  separatorColor: 'rgba(0, 255, 255, 0.3)',
  showArrow: false,
  arrowSize: 0
};

// ============================================
// Minimal Theme
// ============================================

/**
 * Minimal Theme - Ultra-compact with no decorations
 */
export const TOOLTIP_MINIMAL_THEME: TooltipTheme = {
  // Container
  backgroundColor: 'rgba(30, 35, 45, 0.9)',
  borderColor: 'transparent',
  borderWidth: 0,
  borderRadius: 4,
  backdropBlur: 8,
  shadow: {
    color: 'rgba(0, 0, 0, 0.3)',
    offsetX: 0,
    offsetY: 2,
    blur: 8
  },
  
  // Typography
  fontFamily: 'Inter, system-ui, sans-serif',
  textColor: '#ffffff',
  textSecondaryColor: 'rgba(255, 255, 255, 0.7)',
  titleFontSize: 10,
  titleFontWeight: 500,
  contentFontSize: 10,
  lineHeight: 1.3,
  
  // Spacing
  padding: { top: 6, right: 8, bottom: 6, left: 8 },
  itemGap: 2,
  headerGap: 4,
  
  // Decorations
  showSeriesIndicator: false,
  seriesIndicatorSize: 0,
  showHeaderSeparator: false,
  separatorColor: 'transparent',
  showArrow: false,
  arrowSize: 0
};

// ============================================
// Theme Utilities
// ============================================

/** Available tooltip theme names */
export type TooltipThemeName = 
  | 'dark' 
  | 'light' 
  | 'glass' 
  | 'midnight' 
  | 'electrochemistry' 
  | 'neon' 
  | 'minimal';

/** Theme registry */
export const TOOLTIP_THEMES: Record<TooltipThemeName, TooltipTheme> = {
  dark: TOOLTIP_DARK_THEME,
  light: TOOLTIP_LIGHT_THEME,
  glass: TOOLTIP_GLASS_THEME,
  midnight: TOOLTIP_MIDNIGHT_THEME,
  electrochemistry: TOOLTIP_ELECTROCHEM_THEME,
  neon: TOOLTIP_NEON_THEME,
  minimal: TOOLTIP_MINIMAL_THEME
};

/**
 * Get a tooltip theme by name
 */
export function getTooltipTheme(name: TooltipThemeName | string): TooltipTheme {
  const theme = TOOLTIP_THEMES[name as TooltipThemeName];
  if (!theme) {
    console.warn(`[Tooltip] Unknown theme "${name}", using dark`);
    return TOOLTIP_DARK_THEME;
  }
  return theme;
}

/**
 * Create a custom tooltip theme by merging with a base theme
 */
export function createTooltipTheme(
  base: TooltipTheme | TooltipThemeName,
  overrides: Partial<TooltipTheme>
): TooltipTheme {
  const baseTheme = typeof base === 'string' ? getTooltipTheme(base) : base;
  
  return {
    ...baseTheme,
    ...overrides,
    padding: { ...baseTheme.padding, ...overrides.padding },
    shadow: { ...baseTheme.shadow, ...overrides.shadow }
  };
}

/**
 * Map chart theme name to matching tooltip theme
 */
export function getTooltipThemeForChartTheme(chartThemeName: string): TooltipTheme {
  switch (chartThemeName.toLowerCase()) {
    case 'light':
      return TOOLTIP_LIGHT_THEME;
    case 'midnight':
      return TOOLTIP_MIDNIGHT_THEME;
    case 'electrochemistry':
    case 'electrochem':
      return TOOLTIP_ELECTROCHEM_THEME;
    case 'dark':
    default:
      return TOOLTIP_DARK_THEME;
  }
}

/** Default tooltip theme */
export const DEFAULT_TOOLTIP_THEME = TOOLTIP_DARK_THEME;
