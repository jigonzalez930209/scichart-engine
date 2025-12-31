/**
 * Theme - Visual styling configuration for SciChart
 *
 * Provides customizable themes for the chart including:
 * - Grid styling
 * - Axis styling
 * - Legend styling
 * - Cursor styling
 */

// ============================================
// Theme Types
// ============================================

export interface GridTheme {
  /** Grid visibility */
  visible: boolean;
  /** Major grid line color */
  majorColor: string;
  /** Minor grid line color */
  minorColor: string;
  /** Major grid line width */
  majorWidth: number;
  /** Minor grid line width */
  minorWidth: number;
  /** Line dash pattern for major lines [dash, gap] */
  majorDash: number[];
  /** Line dash pattern for minor lines [dash, gap] */
  minorDash: number[];
  /** Show minor grid lines */
  showMinor: boolean;
  /** Number of minor divisions between major lines */
  minorDivisions: number;
}

export interface AxisTheme {
  /** Axis line color */
  lineColor: string;
  /** Axis line width */
  lineWidth: number;
  /** Tick mark color */
  tickColor: string;
  /** Tick mark length */
  tickLength: number;
  /** Label color */
  labelColor: string;
  /** Label font size */
  labelSize: number;
  /** Axis title color */
  titleColor: string;
  /** Axis title font size */
  titleSize: number;
  /** Font family */
  fontFamily: string;
}

export interface LegendTheme {
  /** Legend visibility */
  visible: boolean;
  /** Position */
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Background color */
  backgroundColor: string;
  /** Border color */
  borderColor: string;
  /** Border radius */
  borderRadius: number;
  /** Text color */
  textColor: string;
  /** Font size */
  fontSize: number;
  /** Font family */
  fontFamily: string;
  /** Padding inside legend */
  padding: number;
  /** Gap between items */
  itemGap: number;
  /** Color swatch size */
  swatchSize: number;
}

export interface CursorTheme {
  /** Cursor line color */
  lineColor: string;
  /** Cursor line width */
  lineWidth: number;
  /** Cursor line dash pattern */
  lineDash: number[];
  /** Tooltip background color */
  tooltipBackground: string;
  /** Tooltip border color */
  tooltipBorder: string;
  /** Tooltip text color */
  tooltipColor: string;
  /** Tooltip font size */
  tooltipSize: number;
}

export interface ChartTheme {
  /** Theme name */
  name: string;
  /** Background color */
  backgroundColor: string;
  /** Plot area border color */
  plotBorderColor: string;
  /** Grid theme */
  grid: GridTheme;
  /** X-axis theme */
  xAxis: AxisTheme;
  /** Y-axis theme */
  yAxis: AxisTheme;
  /** Legend theme */
  legend: LegendTheme;
  /** Cursor theme */
  cursor: CursorTheme;
}

// ============================================
// Default Themes
// ============================================

const DEFAULT_AXIS_THEME: AxisTheme = {
  lineColor: "#666666", // Brighter
  lineWidth: 1,
  tickColor: "#888888", // Brighter
  tickLength: 6,
  labelColor: "#cccccc", // Brighter
  labelSize: 12, // Larger
  titleColor: "#ffffff", // Brighter
  titleSize: 14, // Larger
  fontFamily: "Inter, system-ui, sans-serif",
};

const DEFAULT_GRID_THEME: GridTheme = {
  visible: true,
  majorColor: "rgba(255, 255, 255, 0.12)", // Higher opacity
  minorColor: "rgba(255, 255, 255, 0.05)",
  majorWidth: 1,
  minorWidth: 0.5,
  majorDash: [4, 4],
  minorDash: [2, 4],
  showMinor: true, // Default to show minor
  minorDivisions: 5,
};

const DEFAULT_LEGEND_THEME: LegendTheme = {
  visible: true,
  position: "top-right",
  backgroundColor: "rgba(20, 20, 30, 0.9)",
  borderColor: "rgba(255, 255, 255, 0.15)",
  borderRadius: 6,
  textColor: "#ffffff",
  fontSize: 11,
  fontFamily: "Inter, system-ui, sans-serif",
  padding: 5,
  itemGap: 3,
  swatchSize: 12,
};

const DEFAULT_CURSOR_THEME: CursorTheme = {
  lineColor: "rgba(255, 255, 255, 0.5)",
  lineWidth: 1,
  lineDash: [5, 5],
  tooltipBackground: "rgba(20, 20, 30, 0.95)",
  tooltipBorder: "rgba(255, 255, 255, 0.2)",
  tooltipColor: "#ffffff",
  tooltipSize: 11,
};

// ============================================
// Preset Themes
// ============================================

export const DARK_THEME: ChartTheme = {
  name: "dark",
  backgroundColor: "#0b0e14",
  plotBorderColor: "#444c56",
  grid: {
    ...DEFAULT_GRID_THEME,
    majorColor: "rgba(255, 255, 255, 0.12)",
    minorColor: "rgba(255, 255, 255, 0.04)",
  },
  xAxis: {
    ...DEFAULT_AXIS_THEME,
    labelColor: "#adbac7",
    titleColor: "#cdd9e5",
    lineColor: "#444c56",
    tickColor: "#444c56",
  },
  yAxis: {
    ...DEFAULT_AXIS_THEME,
    labelColor: "#adbac7",
    titleColor: "#cdd9e5",
    lineColor: "#444c56",
    tickColor: "#444c56",
  },
  legend: DEFAULT_LEGEND_THEME,
  cursor: DEFAULT_CURSOR_THEME,
};

export const MIDNIGHT_THEME: ChartTheme = {
  name: "midnight",
  backgroundColor: "#05050a",
  plotBorderColor: "#3a3a5a",
  grid: {
    ...DEFAULT_GRID_THEME,
    majorColor: "rgba(150, 150, 255, 0.2)",
    minorColor: "rgba(150, 150, 255, 0.08)",
  },
  xAxis: {
    ...DEFAULT_AXIS_THEME,
    lineColor: "#5a5a8a",
    labelColor: "#b0b0e0",
    titleColor: "#d0d0f0",
    tickColor: "#5a5a8a",
  },
  yAxis: {
    ...DEFAULT_AXIS_THEME,
    lineColor: "#5a5a8a",
    labelColor: "#b0b0e0",
    titleColor: "#d0d0f0",
    tickColor: "#5a5a8a",
  },
  legend: {
    ...DEFAULT_LEGEND_THEME,
    backgroundColor: "rgba(15, 15, 30, 0.95)",
    borderColor: "rgba(100, 100, 255, 0.4)",
  },
  cursor: {
    ...DEFAULT_CURSOR_THEME,
    lineColor: "rgba(150, 150, 255, 0.7)",
  },
};

/** Light theme - Clean white background */
export const LIGHT_THEME: ChartTheme = {
  name: "light",
  backgroundColor: "#ffffff",
  plotBorderColor: "#cccccc",
  grid: {
    ...DEFAULT_GRID_THEME,
    majorColor: "rgba(0, 0, 0, 0.1)",
    minorColor: "rgba(0, 0, 0, 0.04)",
  },
  xAxis: {
    ...DEFAULT_AXIS_THEME,
    lineColor: "#888888",
    tickColor: "#888888",
    labelColor: "#444444",
    titleColor: "#222222",
  },
  yAxis: {
    ...DEFAULT_AXIS_THEME,
    lineColor: "#888888",
    tickColor: "#888888",
    labelColor: "#444444",
    titleColor: "#222222",
  },
  legend: {
    ...DEFAULT_LEGEND_THEME,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderColor: "rgba(0, 0, 0, 0.15)",
    textColor: "#222222",
  },
  cursor: {
    ...DEFAULT_CURSOR_THEME,
    lineColor: "rgba(0, 0, 0, 0.4)",
    tooltipBackground: "rgba(50, 50, 60, 0.95)",
  },
};

/** Electrochemistry theme - Professional blue tones */
export const ELECTROCHEM_THEME: ChartTheme = {
  name: "electrochemistry",
  backgroundColor: "#0a1628",
  plotBorderColor: "#1e3a5f",
  grid: {
    ...DEFAULT_GRID_THEME,
    majorColor: "rgba(30, 136, 229, 0.15)",
    minorColor: "rgba(30, 136, 229, 0.06)",
    showMinor: true,
    minorDivisions: 2,
  },
  xAxis: {
    ...DEFAULT_AXIS_THEME,
    lineColor: "#1e88e5",
    tickColor: "#42a5f5",
    labelColor: "#90caf9",
    titleColor: "#bbdefb",
  },
  yAxis: {
    ...DEFAULT_AXIS_THEME,
    lineColor: "#1e88e5",
    tickColor: "#42a5f5",
    labelColor: "#90caf9",
    titleColor: "#bbdefb",
  },
  legend: {
    ...DEFAULT_LEGEND_THEME,
    backgroundColor: "rgba(10, 22, 40, 0.95)",
    borderColor: "rgba(30, 136, 229, 0.3)",
  },
  cursor: {
    ...DEFAULT_CURSOR_THEME,
    lineColor: "rgba(100, 180, 255, 0.6)",
  },
};

// ============================================
// Theme Utilities
// ============================================

/**
 * Create a custom theme by merging with base theme
 */
export function createTheme(
  base: ChartTheme,
  overrides: Partial<ChartTheme>
): ChartTheme {
  return {
    ...base,
    ...overrides,
    grid: { ...base.grid, ...overrides.grid },
    xAxis: { ...base.xAxis, ...overrides.xAxis },
    yAxis: { ...base.yAxis, ...overrides.yAxis },
    legend: { ...base.legend, ...overrides.legend },
    cursor: { ...base.cursor, ...overrides.cursor },
  };
}

/**
 * Get a theme by name
 */
export function getThemeByName(name: string): ChartTheme {
  switch (name) {
    case "dark":
      return DARK_THEME;
    case "midnight":
      return MIDNIGHT_THEME;
    case "light":
      return LIGHT_THEME;
    case "electrochemistry":
    case "electrochem":
      return ELECTROCHEM_THEME;
    default:
      console.warn(`[Theme] Unknown theme "${name}", using dark`);
      return DARK_THEME;
  }
}

/** Default theme export */
export const DEFAULT_THEME = DARK_THEME;
