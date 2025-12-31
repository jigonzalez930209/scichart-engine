/**
 * InteractionManager - Handles mouse, touch, and keyboard interactions
 *
 * This module manages all user interactions with the chart including:
 * - Zoom (mouse wheel)
 * - Pan (mouse drag, touch drag)
 * - Cursor tracking
 */

import type { Bounds } from "../types";

// ============================================
// Types
// ============================================

export interface AxisLayout {
  id: string;
  position: 'left' | 'right';
  offset: number;
}

export interface InteractionCallbacks {
  onZoom: (bounds: Bounds, axisId?: string) => void;
  onPan: (deltaX: number, deltaY: number, axisId?: string) => void;
  onBoxZoom: (
    rect: { x: number; y: number; width: number; height: number } | null
  ) => void;
  onCursorMove: (x: number, y: number) => void;
  onCursorLeave: () => void;
}

export interface PlotAreaGetter {
  (): { x: number; y: number; width: number; height: number };
}

export interface BoundsGetter {
  (axisId?: string): Bounds;
}

export interface AxisLayoutGetter {
  (): AxisLayout[];
}

// ============================================
// Interaction Manager Class
// ============================================

export class InteractionManager {
  private container: HTMLElement;
  private callbacks: InteractionCallbacks;
  private getPlotArea: PlotAreaGetter;
  private getBounds: BoundsGetter;
  private getAxesLayout: AxisLayoutGetter;

  private isDragging = false;
  private panningAxisId?: string;
  private isBoxSelecting = false;
  private selectionStart = { x: 0, y: 0 };
  private lastMousePos = { x: 0, y: 0 };
  private isPanMode = true;

  // Bound handlers for cleanup
  private boundWheel: (e: WheelEvent) => void;
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundMouseLeave: (e: MouseEvent) => void;
  private boundTouchStart: (e: TouchEvent) => void;
  private boundTouchMove: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;

  constructor(
    container: HTMLElement,
    callbacks: InteractionCallbacks,
    getPlotArea: PlotAreaGetter,
    getBounds: BoundsGetter,
    getAxesLayout: AxisLayoutGetter
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.getPlotArea = getPlotArea;
    this.getBounds = getBounds;
    this.getAxesLayout = getAxesLayout;

    // Bind handlers
    this.boundWheel = this.handleWheel.bind(this);
    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundMouseLeave = this.handleMouseLeave.bind(this);
    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);

    this.attachListeners();
  }

  private attachListeners(): void {
    this.container.addEventListener("wheel", this.boundWheel, {
      passive: false,
    });
    this.container.addEventListener("mousedown", this.boundMouseDown);
    this.container.addEventListener("mousemove", this.boundMouseMove);
    this.container.addEventListener("mouseup", this.boundMouseUp);
    this.container.addEventListener("mouseleave", this.boundMouseLeave);
    this.container.addEventListener("touchstart", this.boundTouchStart);
    this.container.addEventListener("touchmove", this.boundTouchMove);
    this.container.addEventListener("touchend", this.boundTouchEnd);
  }

  private detachListeners(): void {
    this.container.removeEventListener("wheel", this.boundWheel);
    this.container.removeEventListener("mousedown", this.boundMouseDown);
    this.container.removeEventListener("mousemove", this.boundMouseMove);
    this.container.removeEventListener("mouseup", this.boundMouseUp);
    this.container.removeEventListener("mouseleave", this.boundMouseLeave);
    this.container.removeEventListener("touchstart", this.boundTouchStart);
    this.container.removeEventListener("touchmove", this.boundTouchMove);
    this.container.removeEventListener("touchend", this.boundTouchEnd);
  }

  public setPanMode(enabled: boolean): void {
    this.isPanMode = enabled;
  }

  // ----------------------------------------
  // Mouse Handlers
  // ----------------------------------------

  private handleWheel(e: WheelEvent): void {
    const plotArea = this.getPlotArea();
    if (plotArea.width <= 1 || plotArea.height <= 1) return;

    e.preventDefault();
    const rect = this.container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Determine zoom targets
    const axes = this.getAxesLayout();
    let zoomX = false;
    let zoomY = false;
    let targetAxisId: string | undefined = undefined;

    // Hit test Y axes
    for (const axis of axes) {
      const axisX = axis.position === 'left' 
        ? plotArea.x - axis.offset 
        : plotArea.x + plotArea.width + axis.offset;
      
      const hitWidth = 65; // Matches axis spacing
      const hitX = axis.position === 'left' ? axisX - hitWidth : axisX;

      if (
        mouseX >= hitX &&
        mouseX <= hitX + hitWidth &&
        mouseY >= plotArea.y &&
        mouseY <= plotArea.y + plotArea.height
      ) {
        targetAxisId = axis.id;
        zoomY = true;
        zoomX = false;
        break;
      }
    }

    if (!targetAxisId) {
      // X Axis area (bottom)
      if (
        mouseY > plotArea.y + plotArea.height &&
        mouseX >= plotArea.x &&
        mouseX <= plotArea.x + plotArea.width
      ) {
        zoomX = true;
      }
      // Plot area (both)
      else if (
        mouseX >= plotArea.x &&
        mouseX <= plotArea.x + plotArea.width &&
        mouseY >= plotArea.y &&
        mouseY <= plotArea.y + plotArea.height
      ) {
        zoomX = true;
        zoomY = true;
      } else {
        return; // Outside interactive areas
      }
    }

    const bounds = this.getBounds(targetAxisId);
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;

    // Calculate zoom center in data coordinates
    const normalizedX = (mouseX - plotArea.x) / plotArea.width;
    const normalizedY = 1 - (mouseY - plotArea.y) / plotArea.height;

    const dataX = bounds.xMin + normalizedX * (bounds.xMax - bounds.xMin);
    const dataY = bounds.yMin + normalizedY * (bounds.yMax - bounds.yMin);

    // Limits
    const MIN_RANGE = 1e-12;
    const MAX_RANGE = 1e15;

    let nextXMin = zoomX
      ? dataX - (dataX - bounds.xMin) * zoomFactor
      : bounds.xMin;
    let nextXMax = zoomX
      ? dataX + (bounds.xMax - dataX) * zoomFactor
      : bounds.xMax;
    let nextYMin = zoomY
      ? dataY - (dataY - bounds.yMin) * zoomFactor
      : bounds.yMin;
    let nextYMax = zoomY
      ? dataY + (bounds.yMax - dataY) * zoomFactor
      : bounds.yMax;

    const nextXRange = nextXMax - nextXMin;
    const nextYRange = nextYMax - nextYMin;

    if (nextXRange < MIN_RANGE || nextXRange > MAX_RANGE) {
      nextXMin = bounds.xMin;
      nextXMax = bounds.xMax;
    }
    if (nextYRange < MIN_RANGE || nextYRange > MAX_RANGE) {
      nextYMin = bounds.yMin;
      nextYMax = bounds.yMax;
    }

    const newBounds: Bounds = {
      xMin: nextXMin,
      xMax: nextXMax,
      yMin: nextYMin,
      yMax: nextYMax,
    };

    this.callbacks.onZoom(newBounds, targetAxisId);
  }

  private handleMouseDown(e: MouseEvent): void {
    const plotArea = this.getPlotArea();
    if (plotArea.width <= 1 || plotArea.height <= 1) return;

    const rect = this.container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if mouse is in axis area for dragging
    const axes = this.getAxesLayout();
    for (const axis of axes) {
      const axisX = axis.position === 'left' 
        ? plotArea.x - axis.offset 
        : plotArea.x + plotArea.width + axis.offset;
      
      const hitWidth = 65;
      const hitX = axis.position === 'left' ? axisX - hitWidth : axisX;

      if (
        mouseX >= hitX &&
        mouseX <= hitX + hitWidth &&
        mouseY >= plotArea.y &&
        mouseY <= plotArea.y + plotArea.height
      ) {
        this.isDragging = true;
        this.panningAxisId = axis.id;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.container.style.cursor = "ns-resize";
        return;
      }
    }

    // Check if mouse is in plot area
    if (
      mouseX >= plotArea.x &&
      mouseX <= plotArea.x + plotArea.width &&
      mouseY >= plotArea.y &&
      mouseY <= plotArea.y + plotArea.height
    ) {
      if (this.isPanMode) {
        this.isDragging = true;
        this.panningAxisId = undefined;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.container.style.cursor = "grabbing";
      } else {
        this.isBoxSelecting = true;
        this.selectionStart = { x: mouseX, y: mouseY };
        this.container.style.cursor = "crosshair";
      }
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Update cursor position
    this.callbacks.onCursorMove(mouseX, mouseY);

    if (this.isDragging) {
      const deltaX = e.clientX - this.lastMousePos.x;
      const deltaY = e.clientY - this.lastMousePos.y;
      this.callbacks.onPan(deltaX, deltaY, this.panningAxisId);
      this.lastMousePos = { x: e.clientX, y: e.clientY };
    } else if (this.isBoxSelecting) {
      const x = Math.min(this.selectionStart.x, mouseX);
      const y = Math.min(this.selectionStart.y, mouseY);
      const width = Math.abs(mouseX - this.selectionStart.x);
      const height = Math.abs(mouseY - this.selectionStart.y);
      this.callbacks.onBoxZoom({ x, y, width, height });
    }
  }

  private handleMouseUp(): void {
    if (this.isBoxSelecting) {
      this.callbacks.onBoxZoom(null); // Signal to apply
    }
    this.isDragging = false;
    this.panningAxisId = undefined;
    this.isBoxSelecting = false;
    this.container.style.cursor = "";
  }

  private handleMouseLeave(): void {
    this.isDragging = false;
    this.panningAxisId = undefined;
    this.container.style.cursor = "";
    this.callbacks.onCursorLeave();
  }

  // ----------------------------------------
  // Touch Handlers
  // ----------------------------------------

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.isDragging = true;
      this.panningAxisId = undefined;
      this.lastMousePos = { x: touch.clientX, y: touch.clientY };
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    if (!this.isDragging || e.touches.length !== 1) return;

    e.preventDefault();

    const touch = e.touches[0];
    const deltaX = touch.clientX - this.lastMousePos.x;
    const deltaY = touch.clientY - this.lastMousePos.y;

    this.callbacks.onPan(deltaX, deltaY, this.panningAxisId);

    this.lastMousePos = { x: touch.clientX, y: touch.clientY };
  }

  private handleTouchEnd(): void {
    this.isDragging = false;
    this.panningAxisId = undefined;
  }

  // ----------------------------------------
  // Cleanup
  // ----------------------------------------

  destroy(): void {
    this.detachListeners();
  }
}
