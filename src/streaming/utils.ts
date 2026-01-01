/**
 * WebSocket Streaming Utilities
 */
import { DataPoint, WebSocketStream } from "./types";

/**
 * Default message parser - expects { x, y, seriesId? } or array of same
 */
export function defaultParser(data: unknown): DataPoint | DataPoint[] | null {
  if (!data || typeof data !== 'object') return null;
  
  // Array of points
  if (Array.isArray(data)) {
    return data
      .filter((item): item is DataPoint => 
        typeof item === 'object' && 
        item !== null && 
        typeof item.x === 'number' && 
        typeof item.y === 'number'
      );
  }
  
  // Single point
  const point = data as Record<string, unknown>;
  if (typeof point.x === 'number' && typeof point.y === 'number') {
    return {
      x: point.x,
      y: point.y,
      seriesId: typeof point.seriesId === 'string' ? point.seriesId : undefined,
    };
  }
  
  return null;
}

/**
 * Helper to create a parser for custom message formats
 */
export function createMessageParser<T>(
  transform: (message: T) => DataPoint | DataPoint[] | null
): (data: unknown) => DataPoint | DataPoint[] | null {
  return (data: unknown) => {
    try {
      return transform(data as T);
    } catch {
      return null;
    }
  };
}

/**
 * Helper to connect a WebSocket stream to a chart
 */
export function connectStreamToChart(
  stream: WebSocketStream,
  chart: { appendData: (seriesId: string, data: { x: Float32Array; y: Float32Array }) => void },
  seriesIds: string[] = ['default']
): () => void {
  const unsubscribers: (() => void)[] = [];

  for (const seriesId of seriesIds) {
    const unsubscribe = stream.subscribe(seriesId, (points) => {
      if (points.length === 0) return;
      
      const x = new Float32Array(points.map(p => p.x));
      const y = new Float32Array(points.map(p => p.y));
      
      chart.appendData(seriesId, { x, y });
    });
    
    unsubscribers.push(unsubscribe);
  }

  // Return cleanup function
  return () => {
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
