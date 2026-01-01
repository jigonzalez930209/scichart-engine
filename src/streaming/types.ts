/**
 * WebSocket Streaming Types
 */

export interface WebSocketStreamConfig {
  /** WebSocket URL */
  url: string;
  /** Reconnection attempts (default: 5) */
  maxReconnectAttempts?: number;
  /** Delay between reconnection attempts in ms (default: 1000) */
  reconnectDelay?: number;
  /** Buffer size before flushing to chart (default: 10) */
  bufferSize?: number;
  /** Throttle updates in ms (default: 16 for 60fps) */
  throttleMs?: number;
  /** Transform incoming message to data point */
  parseMessage?: (data: unknown) => DataPoint | DataPoint[] | null;
  /** Called on connection open */
  onConnect?: () => void;
  /** Called on connection close */
  onDisconnect?: (event: CloseEvent) => void;
  /** Called on error */
  onError?: (error: Event) => void;
  /** Called when reconnecting */
  onReconnect?: (attempt: number) => void;
}

export interface DataPoint {
  x: number;
  y: number;
  seriesId?: string;
}

export interface WebSocketStream {
  /** Connect to the WebSocket server */
  connect(): void;
  /** Disconnect from the WebSocket server */
  disconnect(): void;
  /** Check if connected */
  isConnected(): boolean;
  /** Get connection state */
  getState(): WebSocketState;
  /** Subscribe to data for a specific series */
  subscribe(seriesId: string, callback: (points: DataPoint[]) => void): () => void;
  /** Unsubscribe all listeners */
  unsubscribeAll(): void;
  /** Send a message to the WebSocket server */
  send(message: unknown): void;
  /** Get statistics */
  getStats(): StreamStats;
}

export interface StreamStats {
  messagesReceived: number;
  pointsProcessed: number;
  reconnectCount: number;
  lastMessageTime: number | null;
  connectionUptime: number;
  bufferSize: number;
}

export type WebSocketState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';
