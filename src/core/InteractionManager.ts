/**
 * InteractionManager - Handles mouse, touch, and keyboard interactions
 *
 * This module manages all user interactions with the chart including:
 * - Zoom (mouse wheel)
 * - Pan (mouse drag, touch drag)
 * - Cursor tracking
 */

import type { Bounds } from '../types';

// ============================================
// Types
// ============================================

export interface InteractionCallbacks {
  onZoom: (bounds: Bounds) => void;
  onPan: (deltaX: number, deltaY: number) => void;
  onBoxZoom: (rect: { x: number; y: number; width: number; height: number } | null) => void;
  onCursorMove: (x: number, y: number) => void;
  onCursorLeave: () => void;
}

export interface PlotAreaGetter {
  (): { x: number; y: number; width: number; height: number };
}

export interface BoundsGetter {
  (): Bounds;
}

// ============================================
// Interaction Manager Class
// ============================================

export class InteractionManager {
  private container: HTMLElement;
  private callbacks: InteractionCallbacks;
  private getPlotArea: PlotAreaGetter;
  private getBounds: BoundsGetter;

  private isDragging = false;
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
    getBounds: BoundsGetter
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.getPlotArea = getPlotArea;
    this.getBounds = getBounds;

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
    this.container.addEventListener('wheel', this.boundWheel, { passive: false });
    this.container.addEventListener('mousedown', this.boundMouseDown);
    this.container.addEventListener('mousemove', this.boundMouseMove);
    this.container.addEventListener('mouseup', this.boundMouseUp);
    this.container.addEventListener('mouseleave', this.boundMouseLeave);
    this.container.addEventListener('touchstart', this.boundTouchStart);
    this.container.addEventListener('touchmove', this.boundTouchMove);
    this.container.addEventListener('touchend', this.boundTouchEnd);
  }

  private detachListeners(): void {
    this.container.removeEventListener('wheel', this.boundWheel);
    this.container.removeEventListener('mousedown', this.boundMouseDown);
    this.container.removeEventListener('mousemove', this.boundMouseMove);
    this.container.removeEventListener('mouseup', this.boundMouseUp);
    this.container.removeEventListener('mouseleave', this.boundMouseLeave);
    this.container.removeEventListener('touchstart', this.boundTouchStart);
    this.container.removeEventListener('touchmove', this.boundTouchMove);
    this.container.removeEventListener('touchend', this.boundTouchEnd);
  }

  public setPanMode(enabled: boolean): void {
    this.isPanMode = enabled;
  }

  // ----------------------------------------
  // Mouse Handlers
  // ----------------------------------------

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();

    const rect = this.container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const plotArea = this.getPlotArea();
    const bounds = this.getBounds();

    // Determine zoom targets
    let zoomX = false;
    let zoomY = false;

    // Y Axis area (left)
    if (mouseX < plotArea.x && mouseY >= plotArea.y && mouseY <= plotArea.y + plotArea.height) {
      zoomY = true;
    }
    // X Axis area (bottom)
    else if (mouseY > plotArea.y + plotArea.height && mouseX >= plotArea.x && mouseX <= plotArea.x + plotArea.width) {
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

    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;

    // Calculate zoom center in data coordinates
    const normalizedX = (mouseX - plotArea.x) / plotArea.width;
    const normalizedY = 1 - (mouseY - plotArea.y) / plotArea.height;

    const dataX = bounds.xMin + normalizedX * (bounds.xMax - bounds.xMin);
    const dataY = bounds.yMin + normalizedY * (bounds.yMax - bounds.yMin);

    const newBounds: Bounds = {
      xMin: zoomX ? dataX - (dataX - bounds.xMin) * zoomFactor : bounds.xMin,
      xMax: zoomX ? dataX + (bounds.xMax - dataX) * zoomFactor : bounds.xMax,
      yMin: zoomY ? dataY - (dataY - bounds.yMin) * zoomFactor : bounds.yMin,
      yMax: zoomY ? dataY + (bounds.yMax - dataY) * zoomFactor : bounds.yMax,
    };

    this.callbacks.onZoom(newBounds);
  }

  private handleMouseDown(e: MouseEvent): void {
    const rect = this.container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const plotArea = this.getPlotArea();

    // Check if mouse is in plot area
    if (
      mouseX >= plotArea.x &&
      mouseX <= plotArea.x + plotArea.width &&
      mouseY >= plotArea.y &&
      mouseY <= plotArea.y + plotArea.height
    ) {
      if (this.isPanMode) {
        this.isDragging = true;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.container.style.cursor = 'grabbing';
      } else {
        this.isBoxSelecting = true;
        this.selectionStart = { x: mouseX, y: mouseY };
        this.container.style.cursor = 'crosshair';
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
      this.callbacks.onPan(deltaX, deltaY);
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
    this.isBoxSelecting = false;
    this.container.style.cursor = '';
  }

  private handleMouseLeave(): void {
    this.isDragging = false;
    this.container.style.cursor = '';
    this.callbacks.onCursorLeave();
  }

  // ----------------------------------------
  // Touch Handlers
  // ----------------------------------------

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.isDragging = true;
      this.lastMousePos = { x: touch.clientX, y: touch.clientY };
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    if (!this.isDragging || e.touches.length !== 1) return;

    e.preventDefault();

    const touch = e.touches[0];
    const deltaX = touch.clientX - this.lastMousePos.x;
    const deltaY = touch.clientY - this.lastMousePos.y;

    this.callbacks.onPan(deltaX, deltaY);

    this.lastMousePos = { x: touch.clientX, y: touch.clientY };
  }

  private handleTouchEnd(): void {
    this.isDragging = false;
  }

  // ----------------------------------------
  // Cleanup
  // ----------------------------------------

  destroy(): void {
    this.detachListeners();
  }
}
