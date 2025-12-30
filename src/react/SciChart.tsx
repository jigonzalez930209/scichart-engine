/**
 * SciChart - React Component for Scientific Charts
 *
 * A declarative React component that wraps the SciChart Engine.
 */

import {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useMemo,
  type CSSProperties,
} from 'react';
import { useSciChart, type UseSciChartOptions } from './useSciChart';
import type { SeriesOptions, ZoomOptions, CursorOptions, Bounds } from '../types';
import type { Chart } from '../core/Chart';

// ============================================
// Types
// ============================================

export interface SciChartSeries {
  id: string;
  x: Float32Array | Float64Array;
  y: Float32Array | Float64Array;
  color?: string;
  width?: number;
  visible?: boolean;
}

export interface SciChartProps extends UseSciChartOptions {
  /** Series data to display */
  series?: SciChartSeries[];
  /** Zoom state (controlled) */
  zoom?: ZoomOptions;
  /** Callback when zoom changes */
  onZoomChange?: (bounds: Bounds) => void;
  /** Cursor configuration */
  cursor?: CursorOptions;
  /** Container width */
  width?: number | string;
  /** Container height */
  height?: number | string;
  /** Additional class name */
  className?: string;
  /** Additional styles */
  style?: CSSProperties;
  /** Debug mode - shows FPS counter */
  debug?: boolean;
}

export interface SciChartRef {
  /** Get the chart instance */
  getChart: () => Chart | null;
  /** Reset zoom to show all data */
  resetZoom: () => void;
  /** Get current bounds */
  getBounds: () => Bounds | null;
}

// ============================================
// Component
// ============================================

/**
 * SciChart React Component
 *
 * @example
 * ```tsx
 * <SciChart
 *   series={[
 *     { id: 'cv-1', x: potentialData, y: currentData, color: '#ff0055' }
 *   ]}
 *   xAxis={{ label: 'E / V' }}
 *   yAxis={{ label: 'I / A' }}
 *   height={400}
 *   cursor={{ enabled: true, snap: true }}
 *   onZoomChange={(bounds) => console.log('Zoom:', bounds)}
 * />
 * ```
 */
export const SciChart = forwardRef<SciChartRef, SciChartProps>(function SciChart(
  {
    series = [],
    zoom: zoomProp,
    onZoomChange,
    cursor,
    width = '100%',
    height = 400,
    className = '',
    style = {},
    debug = false,
    ...chartOptions
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousSeriesRef = useRef<Map<string, SciChartSeries>>(new Map());

  const {
    chart,
    isReady,
    bounds,
    addSeries,
    updateSeries,
    removeSeries,
    resetZoom,
  } = useSciChart(canvasRef, chartOptions);

  // Expose methods via ref
  useImperativeHandle(
    ref,
    () => ({
      getChart: () => chart,
      resetZoom,
      getBounds: () => bounds,
    }),
    [chart, resetZoom, bounds]
  );

  // Handle series changes
  useEffect(() => {
    if (!isReady || !chart) return;

    const currentSeriesMap = new Map(series.map((s) => [s.id, s]));
    const previousSeriesMap = previousSeriesRef.current;

    // Remove series that no longer exist
    previousSeriesMap.forEach((_, id) => {
      if (!currentSeriesMap.has(id)) {
        removeSeries(id);
      }
    });

    // Add or update series
    currentSeriesMap.forEach((seriesData, id) => {
      const prevSeries = previousSeriesMap.get(id);

      if (!prevSeries) {
        // New series - add it
        const options: SeriesOptions = {
          id: seriesData.id,
          type: 'line',
          data: { x: seriesData.x, y: seriesData.y },
          style: {
            color: seriesData.color ?? '#ff0055',
            width: seriesData.width ?? 1.5,
          },
          visible: seriesData.visible ?? true,
        };
        addSeries(options);
      } else if (
        prevSeries.x !== seriesData.x ||
        prevSeries.y !== seriesData.y
      ) {
        // Data changed - update
        updateSeries(id, {
          x: seriesData.x,
          y: seriesData.y,
        });
      }
    });

    previousSeriesRef.current = currentSeriesMap;
  }, [series, isReady, chart, addSeries, updateSeries, removeSeries]);

  // Handle controlled zoom
  useEffect(() => {
    if (!isReady || !chart || !zoomProp) return;
    chart.zoom(zoomProp);
  }, [isReady, chart, zoomProp]);

  // Handle zoom change callback
  useEffect(() => {
    if (!isReady || !chart || !onZoomChange) return;

    chart.on('zoom', (event) => {
      onZoomChange({
        xMin: event.x[0],
        xMax: event.x[1],
        yMin: event.y[0],
        yMax: event.y[1],
      });
    });
  }, [isReady, chart, onZoomChange]);

  // Handle cursor
  useEffect(() => {
    if (!isReady || !chart) return;

    if (cursor?.enabled) {
      chart.enableCursor(cursor);
    } else {
      chart.disableCursor();
    }
  }, [isReady, chart, cursor]);

  // Container styles
  const containerStyle = useMemo<CSSProperties>(
    () => ({
      position: 'relative',
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      ...style,
    }),
    [width, height, style]
  );

  const canvasStyle = useMemo<CSSProperties>(
    () => ({
      width: '100%',
      height: '100%',
      display: 'block',
    }),
    []
  );

  return (
    <div
      ref={containerRef}
      className={`scichart-container ${className}`}
      style={containerStyle}
    >
      <canvas ref={canvasRef} style={canvasStyle} />

      {/* Debug overlay */}
      {debug && bounds && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(0,0,0,0.7)',
            color: '#0f0',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontFamily: 'monospace',
          }}
        >
          <div>X: [{bounds.xMin.toFixed(3)}, {bounds.xMax.toFixed(3)}]</div>
          <div>Y: [{bounds.yMin.toExponential(2)}, {bounds.yMax.toExponential(2)}]</div>
          <div>Series: {series.length}</div>
        </div>
      )}
    </div>
  );
});

export default SciChart;
