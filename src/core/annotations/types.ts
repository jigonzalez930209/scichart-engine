/**
 * Annotation Types
 * 
 * Type definitions for all annotation types supported by SciChart Engine.
 */

// ============================================
// Base Types
// ============================================

export type AnnotationType = 
  | 'horizontal-line'
  | 'vertical-line'
  | 'rectangle'
  | 'band'
  | 'text'
  | 'arrow';

export interface BaseAnnotation {
  /** Unique identifier (auto-generated if not provided) */
  id?: string;
  /** Annotation type */
  type: AnnotationType;
  /** Visibility */
  visible?: boolean;
  /** Allow user interaction (dragging) */
  interactive?: boolean;
  /** Z-index for layering */
  zIndex?: number;
  /** Tooltip text or configuration */
  tooltip?: string | any;
}

// ============================================
// Line Annotations
// ============================================

export interface HorizontalLineAnnotation extends BaseAnnotation {
  type: 'horizontal-line';
  /** Y value in data coordinates */
  y: number;
  /** Optional: limit line extent to X range */
  xMin?: number;
  xMax?: number;
  /** Line color (hex or rgba) */
  color?: string;
  /** Line width in pixels */
  lineWidth?: number;
  /** Dash pattern [dash, gap] - empty for solid */
  lineDash?: number[];
  /** Label text */
  label?: string;
  /** Label position along the line */
  labelPosition?: 'left' | 'right' | 'center';
  /** Label background color */
  labelBackground?: string;
}

export interface VerticalLineAnnotation extends BaseAnnotation {
  type: 'vertical-line';
  /** X value in data coordinates */
  x: number;
  /** Optional: limit line extent to Y range */
  yMin?: number;
  yMax?: number;
  /** Line color */
  color?: string;
  /** Line width in pixels */
  lineWidth?: number;
  /** Dash pattern */
  lineDash?: number[];
  /** Label text */
  label?: string;
  /** Label position */
  labelPosition?: 'top' | 'bottom' | 'center';
  /** Label background color */
  labelBackground?: string;
}

// ============================================
// Shape Annotations
// ============================================

export interface RectangleAnnotation extends BaseAnnotation {
  type: 'rectangle';
  /** Rectangle bounds in data coordinates */
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  /** Fill color (use alpha for transparency) */
  fillColor?: string;
  /** Border color */
  strokeColor?: string;
  /** Border width */
  strokeWidth?: number;
  /** Border dash pattern */
  strokeDash?: number[];
  /** Label text */
  label?: string;
}

export interface BandAnnotation extends BaseAnnotation {
  type: 'band';
  /** Band bounds - vertical band if only x specified, horizontal if only y */
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  /** Fill color */
  fillColor?: string;
  /** Border color */
  strokeColor?: string;
  /** Border width */
  strokeWidth?: number;
  /** Label text */
  label?: string;
  /** Label position */
  labelPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

// ============================================
// Text Annotation
// ============================================

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  /** Position in data coordinates */
  x: number;
  y: number;
  /** Text content */
  text: string;
  /** Font size in pixels */
  fontSize?: number;
  /** Font family */
  fontFamily?: string;
  /** Font weight */
  fontWeight?: 'normal' | 'bold';
  /** Text color */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Background padding */
  padding?: number;
  /** Rotation in degrees */
  rotation?: number;
  /** Anchor point for positioning */
  anchor?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 
           'top-center' | 'bottom-center' | 'left-center' | 'right-center';
}

// ============================================
// Arrow Annotation
// ============================================

export interface ArrowAnnotation extends BaseAnnotation {
  type: 'arrow';
  /** Start point in data coordinates */
  x1: number;
  y1: number;
  /** End point (arrow head) in data coordinates */
  x2: number;
  y2: number;
  /** Line color */
  color?: string;
  /** Line width */
  lineWidth?: number;
  /** Arrow head size in pixels */
  headSize?: number;
  /** Arrow head style */
  headStyle?: 'filled' | 'open' | 'none';
  /** Show tail arrow */
  showTail?: boolean;
  /** Label text */
  label?: string;
}

// ============================================
// Union Type
// ============================================

export type Annotation = 
  | HorizontalLineAnnotation
  | VerticalLineAnnotation
  | RectangleAnnotation
  | BandAnnotation
  | TextAnnotation
  | ArrowAnnotation;

// ============================================
// Resolved Annotation (with all defaults applied)
// ============================================

export interface ResolvedAnnotation extends BaseAnnotation {
  id: string; // ID is always present after resolution
}

// ============================================
// Annotation Events
// ============================================

export interface AnnotationEvent {
  annotation: Annotation;
  originalEvent?: MouseEvent;
}

export interface AnnotationDragEvent extends AnnotationEvent {
  deltaX: number;
  deltaY: number;
  newPosition: { x: number; y: number };
}
