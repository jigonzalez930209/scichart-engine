/**
 * Mock WebSocket Stream for Testing
 */
import { DataPoint, WebSocketStream, StreamStats } from "./types";

/**
 * Mock WebSocket stream for testing
 */
export function createMockStream(config: {
  interval?: number;
  generatePoint?: () => DataPoint;
}): WebSocketStream & { start: () => void; stop: () => void } {
  const { interval = 100, generatePoint = defaultGenerator } = config;
  
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let connected = false;
  const subscribers = new Map<string, Set<(points: DataPoint[]) => void>>();
  
  const stats: StreamStats = {
    messagesReceived: 0,
    pointsProcessed: 0,
    reconnectCount: 0,
    lastMessageTime: null,
    connectionUptime: 0,
    bufferSize: 0,
  };

  let startTime: number | null = null;

  function start(): void {
    if (intervalId) return;
    
    startTime = Date.now();
    intervalId = setInterval(() => {
      const point = generatePoint();
      stats.messagesReceived++;
      stats.pointsProcessed++;
      stats.lastMessageTime = Date.now();
      
      const seriesId = point.seriesId || 'default';
      const callbacks = subscribers.get(seriesId);
      
      if (callbacks) {
        for (const callback of callbacks) {
          callback([point]);
        }
      }
    }, interval);
  }

  function stop(): void {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    startTime = null;
  }

  return {
    connect: () => { connected = true; start(); },
    disconnect: () => { connected = false; stop(); },
    isConnected: () => connected,
    getState: () => connected ? 'connected' : 'disconnected',
    subscribe: (seriesId, callback) => {
      if (!subscribers.has(seriesId)) {
        subscribers.set(seriesId, new Set());
      }
      subscribers.get(seriesId)!.add(callback);
      return () => {
        subscribers.get(seriesId)?.delete(callback);
      };
    },
    unsubscribeAll: () => subscribers.clear(),
    send: () => {},
    getStats: () => ({
      ...stats,
      connectionUptime: startTime ? Date.now() - startTime : 0,
    }),
    start,
    stop,
  };
}

let mockX = 0;
function defaultGenerator(): DataPoint {
  return {
    x: mockX++,
    y: Math.sin(mockX * 0.1) + Math.random() * 0.2,
  };
}
