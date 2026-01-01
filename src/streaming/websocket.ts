/**
 * WebSocket Stream Implementation
 */
import { 
  WebSocketStreamConfig, 
  DataPoint, 
  WebSocketStream, 
  StreamStats, 
  WebSocketState 
} from "./types";
import { defaultParser } from "./utils";

/**
 * Create a WebSocket stream for real-time chart data
 */
export function createWebSocketStream(config: WebSocketStreamConfig): WebSocketStream {
  const {
    url,
    maxReconnectAttempts = 5,
    reconnectDelay = 1000,
    bufferSize = 10,
    throttleMs = 16,
    parseMessage = defaultParser,
    onConnect,
    onDisconnect,
    onError,
    onReconnect,
  } = config;

  let ws: WebSocket | null = null;
  let state: WebSocketState = 'disconnected';
  let reconnectAttempts = 0;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let connectionStartTime: number | null = null;

  const buffers = new Map<string, DataPoint[]>();
  const subscribers = new Map<string, Set<(points: DataPoint[]) => void>>();
  
  const stats: StreamStats = {
    messagesReceived: 0,
    pointsProcessed: 0,
    reconnectCount: 0,
    lastMessageTime: null,
    connectionUptime: 0,
    bufferSize: 0,
  };

  let lastFlushTime = 0;
  let flushScheduled = false;

  function connect(): void {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    state = 'connecting';
    try {
      ws = new WebSocket(url);
      ws.onopen = () => {
        state = 'connected';
        reconnectAttempts = 0;
        connectionStartTime = Date.now();
        onConnect?.();
      };
      ws.onmessage = (event) => handleMessage(event.data);
      ws.onclose = (event) => {
        state = 'disconnected';
        connectionStartTime = null;
        onDisconnect?.(event);
        if (!event.wasClean && reconnectAttempts < maxReconnectAttempts) scheduleReconnect();
      };
      ws.onerror = (error) => {
        state = 'error';
        onError?.(error);
      };
    } catch (error) {
      state = 'error';
      onError?.(error as Event);
    }
  }

  function disconnect(): void {
    if (reconnectTimeout) { clearTimeout(reconnectTimeout); reconnectTimeout = null; }
    if (ws) { ws.close(1000, 'Client disconnect'); ws = null; }
    state = 'disconnected';
    reconnectAttempts = 0;
    buffers.clear();
  }

  function scheduleReconnect(): void {
    if (reconnectTimeout) return;
    state = 'reconnecting';
    reconnectAttempts++;
    stats.reconnectCount++;
    onReconnect?.(reconnectAttempts);
    reconnectTimeout = setTimeout(() => {
      reconnectTimeout = null;
      connect();
    }, reconnectDelay * reconnectAttempts);
  }

  function handleMessage(data: unknown): void {
    stats.messagesReceived++;
    stats.lastMessageTime = Date.now();
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      const points = parseMessage(parsed);
      if (!points) return;
      const pointArray = Array.isArray(points) ? points : [points];
      for (const point of pointArray) {
        const seriesId = point.seriesId || 'default';
        if (!buffers.has(seriesId)) buffers.set(seriesId, []);
        buffers.get(seriesId)!.push(point);
        stats.pointsProcessed++;
      }
      stats.bufferSize = Array.from(buffers.values()).reduce((sum, b) => sum + b.length, 0);
      scheduleFlush();
    } catch {}
  }

  function scheduleFlush(): void {
    if (flushScheduled) return;
    const now = performance.now();
    const timeSinceLastFlush = now - lastFlushTime;
    if (timeSinceLastFlush >= throttleMs) {
      flush();
    } else {
      flushScheduled = true;
      setTimeout(() => { flushScheduled = false; flush(); }, throttleMs - timeSinceLastFlush);
    }
  }

  function flush(): void {
    lastFlushTime = performance.now();
    for (const [seriesId, buffer] of buffers.entries()) {
      if (buffer.length === 0) continue;
      if (buffer.length >= bufferSize || performance.now() - lastFlushTime > throttleMs * 2) {
        const callbacks = subscribers.get(seriesId);
        if (callbacks) {
          const points = buffer.splice(0, buffer.length);
          for (const callback of callbacks) callback(points);
        } else {
          buffer.length = 0;
        }
      }
    }
    stats.bufferSize = Array.from(buffers.values()).reduce((sum, b) => sum + b.length, 0);
  }

  return {
    connect,
    disconnect,
    isConnected: () => ws !== null && ws.readyState === WebSocket.OPEN,
    getState: () => state,
    subscribe: (seriesId, callback) => {
      if (!subscribers.has(seriesId)) subscribers.set(seriesId, new Set());
      subscribers.get(seriesId)!.add(callback);
      return () => {
        const callbacks = subscribers.get(seriesId);
        if (callbacks) {
          callbacks.delete(callback);
          if (callbacks.size === 0) subscribers.delete(seriesId);
        }
      };
    },
    unsubscribeAll: () => { subscribers.clear(); buffers.clear(); },
    send: (message) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(typeof message === 'string' ? message : JSON.stringify(message));
      }
    },
    getStats: () => ({ ...stats, connectionUptime: connectionStartTime ? Date.now() - connectionStartTime : 0 }),
  };
}
