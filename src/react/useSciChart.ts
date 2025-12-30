/**
 * useSciChart - React hook for SciChart Engine
 *
 * Manages chart lifecycle and provides a clean React API.
 */

import { useEffect, useRef, useState, useCallback, type RefObject } from 'react';
import { createChart, type Chart, type ChartOptions } from '../core/Chart';
import type { SeriesOptions, SeriesUpdateData, ZoomOptions, Bounds } from '../types';

export interface UseSciChartOptions extends Omit<ChartOptions, 'canvas'> {
  /** Auto-resize on container changes */
  autoResize?: boolean;
}

export interface UseSciChartReturn {
  /** Chart instance (null until initialized) */
  chart: Chart | null;
  /** Whether the chart is ready */
  isReady: boolean;
  /** Error during initialization */
  error: Error | null;
  /** Current view bounds */
  bounds: Bounds | null;
  /** Add a series */
  addSeries: (options: SeriesOptions) => void;
  /** Update series data */
  updateSeries: (id: string, data: SeriesUpdateData) => void;
  /** Remove a series */
  removeSeries: (id: string) => void;
  /** Set zoom range */
  zoom: (options: ZoomOptions) => void;
  /** Reset zoom to show all data */
  resetZoom: () => void;
}

/**
 * React hook for using SciChart Engine
 *
 * @example
 * ```tsx
 * function MyChart() {
 *   const canvasRef = useRef<HTMLCanvasElement>(null);
 *   const { chart, isReady, addSeries, zoom } = useSciChart(canvasRef, {
 *     xAxis: { label: 'E / V' },
 *     yAxis: { label: 'I / A' }
 *   });
 *
 *   useEffect(() => {
 *     if (isReady) {
 *       addSeries({
 *         id: 'cv-1',
 *         type: 'line',
 *         data: { x: xData, y: yData },
 *         style: { color: '#ff0055' }
 *       });
 *     }
 *   }, [isReady]);
 *
 *   return <canvas ref={canvasRef} />;
 * }
 * ```
 */
export function useSciChart(
  canvasRef: RefObject<HTMLCanvasElement>,
  options: UseSciChartOptions = {}
): UseSciChartReturn {
  const [chart, setChart] = useState<Chart | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);

  // Store options in ref to avoid re-creating chart on every render
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Initialize chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const chartInstance = createChart({
        canvas,
        ...optionsRef.current,
      });

      // Listen to zoom events to update bounds
      chartInstance.on('zoom', () => {
        setBounds(chartInstance.getViewBounds());
      });

      setChart(chartInstance);
      setIsReady(true);
      setBounds(chartInstance.getViewBounds());
      setError(null);

      console.log('[useSciChart] Chart initialized');
    } catch (err) {
      console.error('[useSciChart] Failed to initialize chart:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsReady(false);
    }

    return () => {
      if (chart) {
        chart.destroy();
        setChart(null);
        setIsReady(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef.current]);

  // Memoized methods
  const addSeries = useCallback(
    (seriesOptions: SeriesOptions) => {
      if (chart) {
        chart.addSeries(seriesOptions);
        setBounds(chart.getViewBounds());
      }
    },
    [chart]
  );

  const updateSeries = useCallback(
    (id: string, data: SeriesUpdateData) => {
      if (chart) {
        chart.updateSeries(id, data);
      }
    },
    [chart]
  );

  const removeSeries = useCallback(
    (id: string) => {
      if (chart) {
        chart.removeSeries(id);
      }
    },
    [chart]
  );

  const zoom = useCallback(
    (zoomOptions: ZoomOptions) => {
      if (chart) {
        chart.zoom(zoomOptions);
      }
    },
    [chart]
  );

  const resetZoom = useCallback(() => {
    if (chart) {
      chart.resetZoom();
      setBounds(chart.getViewBounds());
    }
  }, [chart]);

  return {
    chart,
    isReady,
    error,
    bounds,
    addSeries,
    updateSeries,
    removeSeries,
    zoom,
    resetZoom,
  };
}
