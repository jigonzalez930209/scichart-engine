/**
 * Tooltip Positioner - Smart positioning algorithms
 * 
 * Handles intelligent tooltip positioning with:
 * - Automatic edge avoidance
 * - Flipping when space is limited
 * - Arrow positioning
 * - Constraint handling
 * 
 * @module tooltip/TooltipPositioner
 */

import type { PlotArea } from '../../types';
import type {
  TooltipPosition,
  TooltipMeasurement,
  TooltipPlacement,
  ArrowPosition
} from './types';

export interface PositionerConfig {
  /** Offset from target point */
  offset: { x: number; y: number };
  /** Preferred placement */
  preferredPosition: TooltipPlacement;
  /** Keep within plot area */
  constrainToPlotArea: boolean;
  /** Keep within container */
  constrainToContainer: boolean;
  /** Flip if not enough space */
  autoFlip: boolean;
  /** Show arrow pointing to target */
  showArrow: boolean;
  /** Arrow size */
  arrowSize: number;
}

export const DEFAULT_POSITIONER_CONFIG: PositionerConfig = {
  offset: { x: 12, y: 12 },
  preferredPosition: 'auto',
  constrainToPlotArea: true,
  constrainToContainer: true,
  autoFlip: true,
  showArrow: true,
  arrowSize: 6
};

/**
 * TooltipPositioner calculates optimal tooltip positions
 */
export class TooltipPositioner {
  private config: PositionerConfig;
  private containerWidth: number = 0;
  private containerHeight: number = 0;
  private plotArea: PlotArea | null = null;

  constructor(config: Partial<PositionerConfig> = {}) {
    this.config = { ...DEFAULT_POSITIONER_CONFIG, ...config };
  }

  /**
   * Update container dimensions
   */
  setContainerSize(width: number, height: number): void {
    this.containerWidth = width;
    this.containerHeight = height;
  }

  /**
   * Update plot area bounds
   */
  setPlotArea(plotArea: PlotArea): void {
    this.plotArea = plotArea;
  }

  /**
   * Update configuration
   */
  configure(config: Partial<PositionerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Calculate optimal tooltip position
   * 
   * @param targetX - Target X coordinate (where tooltip points to)
   * @param targetY - Target Y coordinate
   * @param measurement - Tooltip dimensions
   * @returns Calculated position with arrow configuration
   */
  calculatePosition(
    targetX: number,
    targetY: number,
    measurement: TooltipMeasurement
  ): TooltipPosition {
    const { offset, preferredPosition, autoFlip, showArrow, arrowSize } = this.config;
    
    // Total dimensions including padding
    const totalWidth = measurement.width + measurement.padding.left + measurement.padding.right;
    const totalHeight = measurement.height + measurement.padding.top + measurement.padding.bottom;
    
    // Determine best position
    let position = this.determinePosition(
      targetX, 
      targetY, 
      totalWidth, 
      totalHeight, 
      preferredPosition
    );
    
    // Calculate initial coordinates based on position
    let { x, y, arrowPosition } = this.calculateCoordinates(
      targetX,
      targetY,
      totalWidth,
      totalHeight,
      position,
      offset,
      showArrow ? arrowSize : 0
    );
    
    let wasFlipped = false;
    
    // Check if we need to flip
    if (autoFlip && !this.fitsInBounds(x, y, totalWidth, totalHeight)) {
      const flippedPosition = this.flipPosition(position);
      const flipped = this.calculateCoordinates(
        targetX,
        targetY,
        totalWidth,
        totalHeight,
        flippedPosition,
        offset,
        showArrow ? arrowSize : 0
      );
      
      // Use flipped if it fits better
      if (this.fitsInBounds(flipped.x, flipped.y, totalWidth, totalHeight)) {
        x = flipped.x;
        y = flipped.y;
        arrowPosition = flipped.arrowPosition;
        wasFlipped = true;
      }
    }
    
    // Constrain to bounds
    const constrained = this.constrainToBounds(x, y, totalWidth, totalHeight);
    
    // Calculate arrow offset based on how much we shifted
    let arrowOffset = 0;
    if (showArrow) {
      if (arrowPosition === 'top' || arrowPosition === 'bottom') {
        // Arrow on horizontal edge - calculate X offset
        const idealArrowX = targetX - constrained.x;
        arrowOffset = Math.max(arrowSize + 4, Math.min(totalWidth - arrowSize - 4, idealArrowX));
      } else if (arrowPosition === 'left' || arrowPosition === 'right') {
        // Arrow on vertical edge - calculate Y offset  
        const idealArrowY = targetY - constrained.y;
        arrowOffset = Math.max(arrowSize + 4, Math.min(totalHeight - arrowSize - 4, idealArrowY));
      }
    }
    
    return {
      x: constrained.x,
      y: constrained.y,
      arrowPosition: showArrow ? arrowPosition : 'none',
      arrowOffset,
      wasFlipped
    };
  }

  /**
   * Determine best position based on available space
   */
  private determinePosition(
    targetX: number,
    targetY: number,
    width: number,
    height: number,
    preferred: TooltipPlacement
  ): 'top' | 'bottom' | 'left' | 'right' {
    if (preferred !== 'auto') {
      return preferred;
    }
    
    // Calculate available space in each direction
    const bounds = this.getConstraintBounds();
    
    const spaceTop = targetY - bounds.top;
    const spaceBottom = bounds.bottom - targetY;
    const spaceLeft = targetX - bounds.left;
    const spaceRight = bounds.right - targetX;
    
    // Prefer vertical placement (top/bottom) for better readability
    const canFitTop = spaceTop >= height + this.config.offset.y;
    const canFitBottom = spaceBottom >= height + this.config.offset.y;
    const canFitRight = spaceRight >= width + this.config.offset.x;
    const canFitLeft = spaceLeft >= width + this.config.offset.x;
    
    // Priority: top > bottom > right > left
    if (canFitTop && spaceTop >= spaceBottom) return 'top';
    if (canFitBottom) return 'bottom';
    if (canFitRight && spaceRight >= spaceLeft) return 'right';
    if (canFitLeft) return 'left';
    
    // Default to position with most space
    const spaces = [
      { pos: 'top' as const, space: spaceTop },
      { pos: 'bottom' as const, space: spaceBottom },
      { pos: 'right' as const, space: spaceRight },
      { pos: 'left' as const, space: spaceLeft }
    ];
    
    return spaces.sort((a, b) => b.space - a.space)[0].pos;
  }

  /**
   * Calculate tooltip coordinates for a given position
   */
  private calculateCoordinates(
    targetX: number,
    targetY: number,
    width: number,
    height: number,
    position: 'top' | 'bottom' | 'left' | 'right',
    offset: { x: number; y: number },
    arrowSize: number
  ): { x: number; y: number; arrowPosition: ArrowPosition } {
    let x: number;
    let y: number;
    let arrowPosition: ArrowPosition;
    
    switch (position) {
      case 'top':
        x = targetX - width / 2;
        y = targetY - height - offset.y - arrowSize;
        arrowPosition = 'bottom';
        break;
        
      case 'bottom':
        x = targetX - width / 2;
        y = targetY + offset.y + arrowSize;
        arrowPosition = 'top';
        break;
        
      case 'right':
        x = targetX + offset.x + arrowSize;
        y = targetY - height / 2;
        arrowPosition = 'left';
        break;
        
      case 'left':
        x = targetX - width - offset.x - arrowSize;
        y = targetY - height / 2;
        arrowPosition = 'right';
        break;
    }
    
    return { x, y, arrowPosition };
  }

  /**
   * Get the opposite position for flipping
   */
  private flipPosition(
    position: 'top' | 'bottom' | 'left' | 'right'
  ): 'top' | 'bottom' | 'left' | 'right' {
    switch (position) {
      case 'top': return 'bottom';
      case 'bottom': return 'top';
      case 'left': return 'right';
      case 'right': return 'left';
    }
  }

  /**
   * Check if tooltip fits within bounds
   */
  private fitsInBounds(x: number, y: number, width: number, height: number): boolean {
    const bounds = this.getConstraintBounds();
    
    return (
      x >= bounds.left &&
      y >= bounds.top &&
      x + width <= bounds.right &&
      y + height <= bounds.bottom
    );
  }

  /**
   * Constrain position to stay within bounds
   */
  private constrainToBounds(
    x: number,
    y: number,
    width: number,
    height: number
  ): { x: number; y: number } {
    const bounds = this.getConstraintBounds();
    const margin = 4; // Small margin from edges
    
    let constrainedX = x;
    let constrainedY = y;
    
    // Horizontal constraints
    if (constrainedX < bounds.left + margin) {
      constrainedX = bounds.left + margin;
    } else if (constrainedX + width > bounds.right - margin) {
      constrainedX = bounds.right - width - margin;
    }
    
    // Vertical constraints
    if (constrainedY < bounds.top + margin) {
      constrainedY = bounds.top + margin;
    } else if (constrainedY + height > bounds.bottom - margin) {
      constrainedY = bounds.bottom - height - margin;
    }
    
    return { x: constrainedX, y: constrainedY };
  }

  /**
   * Get the bounds to constrain tooltip within
   */
  private getConstraintBounds(): { top: number; left: number; right: number; bottom: number } {
    let bounds = {
      top: 0,
      left: 0,
      right: this.containerWidth,
      bottom: this.containerHeight
    };
    
    if (this.config.constrainToPlotArea && this.plotArea) {
      bounds = {
        top: Math.max(bounds.top, this.plotArea.y),
        left: Math.max(bounds.left, this.plotArea.x),
        right: Math.min(bounds.right, this.plotArea.x + this.plotArea.width),
        bottom: Math.min(bounds.bottom, this.plotArea.y + this.plotArea.height)
      };
    }
    
    return bounds;
  }

  /**
   * Calculate position for crosshair tooltip (follows cursor vertically)
   */
  calculateCrosshairPosition(
    cursorX: number,
    cursorY: number,
    measurement: TooltipMeasurement
  ): TooltipPosition {
    const { offset } = this.config;
    const bounds = this.getConstraintBounds();
    
    const totalWidth = measurement.width + measurement.padding.left + measurement.padding.right;
    const totalHeight = measurement.height + measurement.padding.top + measurement.padding.bottom;
    
    // Position to the right of cursor by default
    let x = cursorX + offset.x;
    let arrowPosition: ArrowPosition = 'left';
    
    // Flip to left if not enough space on right
    if (x + totalWidth > bounds.right - 4) {
      x = cursorX - totalWidth - offset.x;
      arrowPosition = 'right';
    }
    
    // Center vertically on cursor
    let y = cursorY - totalHeight / 2;
    
    // Constrain vertically
    y = Math.max(bounds.top + 4, Math.min(bounds.bottom - totalHeight - 4, y));
    
    // Calculate arrow offset (centered on cursor Y)
    const arrowOffset = cursorY - y;
    
    return {
      x,
      y,
      arrowPosition,
      arrowOffset: Math.max(8, Math.min(totalHeight - 8, arrowOffset)),
      wasFlipped: arrowPosition === 'right'
    };
  }
}

// Export singleton-like factory
export function createTooltipPositioner(
  config?: Partial<PositionerConfig>
): TooltipPositioner {
  return new TooltipPositioner(config);
}
